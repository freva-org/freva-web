set -e
for i in 1 2 3 4 5; do
    freva plugin dummyplugin \
        the_number=$i \
        levels="500,850" \
        input=/tmp
done