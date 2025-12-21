while node -v
do
    which node
    mv "$(which node)" "$(which node)".bak
done
