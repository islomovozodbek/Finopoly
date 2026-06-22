import json
import re

with open('/Users/user/.gemini/antigravity-ide/scratch/extracted_docx.txt', 'r') as f:
    lines = f.readlines()

eras = []
current_era = None
current_type = None

def parse_percentage(s):
    match = re.search(r'([-+]?\d+)%', s)
    if match:
        return int(match.group(1))
    return 0

for i, line in enumerate(lines):
    line = line.strip()
    if not line:
        continue
        
    if "Full Investment Impact Breakdown" in line or "Overview" in line and "Crisis" in line:
        if current_era:
            eras.append(current_era)
        
        name = line.split("–")[0].replace("📉", "").replace("⚠️", "").strip()
        if "Overview" in name:
            name = name.replace(": Overview", "").strip()
            
        current_era = {
            "id": name.lower().replace(" ", "_").replace(".", ""),
            "name": name,
            "investments": []
        }
        continue
        
    if current_era:
        if "36 Good" in line or "36 Investment Options That Performed Well" in line or "36 Investments That Performed Well" in line:
            current_type = "Good"
            continue
        elif "36 Bad" in line or "36 Investment Options That Performed Poorly" in line or "36 Investments That Performed Poorly" in line:
            current_type = "Bad"
            continue
            
        if current_type and "–" in line and not "Summary:" in line and not "Impacts:" in line:
            # Format: Name (Ticker) – Reason +%
            parts = line.split("–")
            if len(parts) >= 2:
                name = parts[0].strip()
                reason = "–".join(parts[1:]).strip()
                pct = parse_percentage(reason)
                
                # Exclude header lines
                if "What It Is" in name or "Reason It Decreased" in name:
                    continue
                    
                current_era["investments"].append({
                    "name": name,
                    "type": current_type,
                    "reason": reason,
                    "percentage": pct
                })
        elif current_type and "\t" in line:
            pass # handle tab separated if needed
            
if current_era:
    eras.append(current_era)

# Clean up
for era in eras:
    # Remove empty ones
    era["investments"] = [inv for inv in era["investments"] if inv["percentage"] != 0 or "0%" in inv["reason"]]

with open('/Users/user/Documents/Finopoly/market-masters/server/data/eras_db.json', 'w') as f:
    json.dump(eras, f, indent=2)

print("Parsed", len(eras), "eras")
for e in eras:
    print(f"  {e['name']}: {len(e['investments'])} investments")
