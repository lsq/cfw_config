#include <assert.h>
#include <node/node_api.h>
#include <windows.h>
#include <stdio.h>
#include <tlhelp32.h>

#include <psapi.h>

void printMyProcess() {
    // Get the current process ID
    DWORD processId = GetCurrentProcessId();

    // Get a handle to the current process
    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processId);
    if (hProcess == NULL) {
        printf("Failed to open process\n");
        return;
    }

    // Get the process name
    char processName[MAX_PATH];
    if (!GetModuleFileNameEx(hProcess, NULL, processName, MAX_PATH)) {
        printf("Failed to get process name\n");
        CloseHandle(hProcess);
        return;
    }

    // Print the process name
    printf("Current process name: %s\n", processName);

    // Close the handle to the process
    CloseHandle(hProcess);
}
typedef enum {
    GET_MODULE_HANDLE_EX_W_UNKNOWN,
    GET_MODULE_HANDLE_EX_W_ERROR
} GetModuleHandleExWError;

GetModuleHandleExWError GetModuleHandleExWErrorFromLastError() {
    DWORD lastError = GetLastError();
    if (lastError != 0) {
        return GET_MODULE_HANDLE_EX_W_ERROR;
    }
    return GET_MODULE_HANDLE_EX_W_UNKNOWN;
}

HMODULE GetCurrentModuleHandle() {
    HMODULE handle = NULL;
    BOOL result = GetModuleHandleExW(0,NULL,
        &handle
    );

    if (result == 0) {
        GetModuleHandleExWError error = GetModuleHandleExWErrorFromLastError();
        if (error == GET_MODULE_HANDLE_EX_W_ERROR) {
            printf("GetModuleHandleExW error: %lu\n", GetLastError());
        } else {
            printf("Unknown GetModuleHandleExW error\n");
        }
        return NULL;
    }

    return handle;
}
HMODULE nodeModule = NULL;
typedef napi_status (*napi_create_string_utf8_func)(napi_env env,
                                                    const char* str,
                                                    size_t length,
                                                    napi_value* result);
typedef napi_status (*napi_define_properties_func)(napi_env env,
                                                   napi_value object,
                                                   size_t property_count,
                                                   const napi_property_descriptor* properties);
napi_create_string_utf8_func napi_create_string_utf8dyn =NULL;
napi_define_properties_func napi_define_propertiesdyn =NULL;
bool LoadNodeFunctions() {
#ifdef LOAD_FROM_PROCESS
    nodeModule = GetCurrentModuleHandle();
#else
    nodeModule = LoadLibraryA("libnode.dll");
#endif
    if (!nodeModule) {
        printf("Failed to load Node.js DLL\n");
        return false;
    }

    napi_create_string_utf8dyn = (napi_create_string_utf8_func)GetProcAddress(nodeModule, "napi_create_string_utf8");
    napi_define_propertiesdyn = (napi_define_properties_func)GetProcAddress(nodeModule, "napi_define_properties");

    if (!napi_create_string_utf8dyn || !napi_define_propertiesdyn) {
        printf("Failed to get function addresses\n");
#ifndef LOAD_FROM_PROCESS
        FreeLibrary(nodeModule);
#endif
        return false;
    }

    return true;
}

napi_value Method(napi_env env, napi_callback_info info) {
    napi_status status;
    napi_value world;
    status = napi_create_string_utf8dyn(env, "world", NAPI_AUTO_LENGTH, &world);
    assert(status == napi_ok);

    return world;
}

#define DECLARE_NAPI_METHOD(name, func)                                        \
    { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value napi_register_module_v1(napi_env env, napi_value exports) {
    printMyProcess();
    if (!nodeModule) {
        if (!LoadNodeFunctions()) {
            return exports;
        }
    }
    napi_status status;
    napi_property_descriptor desc = DECLARE_NAPI_METHOD("hello", Method);
    status = napi_define_propertiesdyn(env, exports, 1, &desc);
    assert(status == napi_ok);

    return exports;
}
