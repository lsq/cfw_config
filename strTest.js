(function() {
                String.prototype.searchAB = function() {
                    return this.match(/[^A|B]/g);
                }
                const str = '本工具由 wwBw.jsjiami.cAom 提供接口。\n专注JS安全领域近10年\n企业化运营\n专业的JS加密研发团队。'.searchAB().toString().replaceAll(',', '');
                const strS = '本工具由 wwBw.jsjiami.cAom 提供接口。\n专注JS安全领域近10年\n企业化运营\n专业的JS加密研发团队。'.searchAB();
                debugger;
                alert(str);
                console.log(strS);
            }());