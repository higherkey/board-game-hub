import os

def is_comment(line, ext):
    line = line.strip()
    if not line:
        return False
    if ext in ['.ts', '.js', '.cs', '.scss', '.css']:
        return line.startswith('//') or line.startswith('/*') or line.startswith('*')
    if ext in ['.html']:
        return line.startswith('<!--')
    return False

def scan_file(filepath):
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return []

    ext = os.path.splitext(filepath)[1].lower()
    
    consecutive_empty = 0
    prev_line = None
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Check excessive blank lines (more than 2 empty lines in a row)
        if not stripped:
            consecutive_empty += 1
        else:
            if consecutive_empty >= 3: # 3 or more empty lines means 2+ *between* elements usually
                issues.append(f"Line {i+1 - consecutive_empty}: Excessive blank lines ({consecutive_empty})")
            consecutive_empty = 0
            
            # Check duplicated comments
            if prev_line is not None and stripped == prev_line and is_comment(stripped, ext):
                issues.append(f"Line {i+1}: Duplicated comment '{stripped[:30]}...'")
            
            prev_line = stripped

    return issues

def main():
    target_dirs = [
        r'c:\Programming\board game hub\frontend\src',
        r'c:\Programming\board game hub\backend\BoardGameHub.Api'
    ]
    extensions = ['.ts', '.html', '.scss', '.cs']
    
    print("# Code Readability Report\n")
    
    found_issues = False
    
    for root_dir in target_dirs:
        for root, dirs, files in os.walk(root_dir):
            if 'node_modules' in root or '.git' in root or 'obj' in root or 'bin' in root:
                continue
                
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    filepath = os.path.join(root, file)
                    issues = scan_file(filepath)
                    if issues:
                        found_issues = True
                        print(f"## {filepath}")
                        for issue in issues:
                            print(f"- {issue}")
                        print("")
                        
    if not found_issues:
        print("No issues found.")

if __name__ == "__main__":
    main()
