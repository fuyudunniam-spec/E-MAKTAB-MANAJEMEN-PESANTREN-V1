
import os

file_path = 'src/App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
mode = 'normal' # normal, head, remote

for line in lines:
    if line.strip().startswith('<<<<<<< HEAD'):
        mode = 'head'
        continue
    elif line.strip().startswith('======='):
        mode = 'remote'
        continue
    elif line.strip().startswith('>>>>>>>'):
        mode = 'normal'
        continue
    
    if mode == 'normal':
        output_lines.append(line)
    elif mode == 'head':
        output_lines.append(line)
    elif mode == 'remote':
        pass # discard

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("Fixed conflicts in src/App.tsx")
