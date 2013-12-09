import sys
file = open(sys.argv[1])
for line in file:
    # print(int(line) ** int(line))
    print(int(line) * int(line))
