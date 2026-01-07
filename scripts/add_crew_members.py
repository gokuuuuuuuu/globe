#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
脚本：为 flightData.ts 中的每个 Flight 添加 crewMembers
根据 data.csv 中的 PF机队名称，找到对应机队的所有成员并添加到航线中
"""

import re
import csv
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
CSV_PATH = ROOT_DIR / 'public' / 'data.csv'
FLIGHT_DATA_PATH = ROOT_DIR / 'src' / 'data' / 'flightData.ts'

def read_csv_team_mapping():
    """读取 CSV 文件，建立 航班号+PF工号 -> 机队名称 的映射"""
    mapping = {}
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            flight_number = row.get('航班号', '').strip()
            pf_id = row.get('PF工号', '').strip()
            team_name = row.get('PF机队名称', '').strip()
            
            if flight_number and pf_id and team_name and team_name != 'nan队' and team_name:
                # 使用 航班号+PF工号 作为唯一标识
                key = f"{flight_number}_{pf_id}"
                if key not in mapping:
                    mapping[key] = team_name
    
    return mapping

def add_crew_members_to_flights():
    """为 flightData.ts 中的每个 Flight 添加 crewMembers"""
    
    # 读取 CSV 映射
    team_mapping = read_csv_team_mapping()
    print(f"从 CSV 读取了 {len(team_mapping)} 条机队映射")
    
    # 读取 flightData.ts
    with open(FLIGHT_DATA_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已经导入了 getTeamByName
    if "import { getTeamByName } from './personData'" not in content:
        # 在文件开头添加 import（在 export const AIRPORT_NAMES_ZH 之前）
        import_line = "import { getTeamByName } from './personData'\n\n"
        insert_pos = content.find('export const AIRPORT_NAMES_ZH')
        content = content[:insert_pos] + import_line + content[insert_pos:]
    
    # 匹配所有 Flight 对象
    # 模式：匹配从 { id: '...' 开始到 }, 结束的 Flight 对象
    flight_pattern = r"(\{\s*id:\s*'[^']+',[\s\S]*?)(\s*\},)"
    
    def replace_flight(match):
        flight_content = match.group(1)
        
        # 检查是否已经有 crewMembers
        if 'crewMembers:' in flight_content:
            return match.group(0)  # 已经有，不修改
        
        # 提取 flightNumber 和 pfId
        flight_number_match = re.search(r"flightNumber:\s*'([^']+)'", flight_content)
        pf_id_match = re.search(r"pfId:\s*'([^']+)'", flight_content)
        
        if not flight_number_match or not pf_id_match:
            return match.group(0)  # 没有必要信息，不修改
        
        flight_number = flight_number_match.group(1)
        pf_id = pf_id_match.group(1)
        key = f"{flight_number}_{pf_id}"
        
        # 查找对应的机队名称
        team_name = team_mapping.get(key)
        if not team_name:
            return match.group(0)  # 没有找到机队，不修改
        
        # 生成 crewMembers 代码
        # 找到最后一个字段的位置（在 }, 之前）
        # 移除最后的 }, 以便插入新字段
        flight_body = flight_content.rstrip()
        if flight_body.endswith(','):
            flight_body = flight_body[:-1].rstrip()
        
        crew_members_code = f""",
    crewMembers: (() => {{
      const team = getTeamByName('{team_name}');
      if (!team) return [];
      return [
        {{ personId: team.leader.id, role: team.leader.pfTechnology || '机长' }},
        ...team.members.map(m => ({{ personId: m.id, role: m.pfTechnology || '第一副驾驶' }}))
      ];
    }})()"""
        
        # 添加 crewMembers 并恢复 }, 
        new_content = flight_body + crew_members_code + match.group(2)
        return new_content
    
    # 替换所有匹配的 Flight 对象
    new_content = re.sub(flight_pattern, replace_flight, content)
    
    # 写入文件
    with open(FLIGHT_DATA_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"已更新 flightData.ts，为航线添加了 crewMembers 信息")

if __name__ == '__main__':
    add_crew_members_to_flights()
