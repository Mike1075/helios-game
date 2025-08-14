# packages/api/belief_compiler.py
import sys
from pathlib import Path

try:
    import yaml  # pip install PyYAML
except ImportError:
    print("缺少依赖：PyYAML。请执行：python -m pip install PyYAML")
    sys.exit(1)

def _get(data, path):
    """支持 a.b.c 和 a.b[0] 取值"""
    cur = data
    parts = []
    for part in path.split("."):
        while "[" in part:
            i = part.index("[")
            if i > 0:
                parts.append(part[:i])
            j = part.index("]")
            parts.append(int(part[i+1:j]))
            part = part[j+1:]
        if part:
            parts.append(part)
    for p in parts:
        cur = cur[p] if isinstance(p, int) else cur.get(p, "")
    return cur

def _render(tpl: str, data: dict) -> str:
    import re
    def repl(m):
        expr = m.group(1).strip()
        if "|" in expr:
            left, pipe = [s.strip() for s in expr.split("|", 1)]
            if pipe.startswith("join(") and pipe.endswith(")"):
                sep = pipe[5:-1].strip('"\'') or ", "
                val = _get(data, left)
                return sep.join(map(str, val)) if isinstance(val, (list, tuple)) else str(val)
        return str(_get(data, expr))
    return re.sub(r"{{\s*(.*?)\s*}}", repl, tpl)

def compile_yaml(yaml_path: Path) -> str:
    data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
    tpl = data.get("rendering", {}).get("system_prompt_template", "")
    if not tpl:
        raise ValueError("YAML 缺少 rendering.system_prompt_template")
    return _render(tpl, data)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python packages/api/belief_compiler.py docs/beliefs/guardian.yaml")
        sys.exit(1)
    print(compile_yaml(Path(sys.argv[1])))
