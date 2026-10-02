#!/usr/bin/env python3
"""Kie AI client for design assets (images and videos). Stdlib only.

Docs: https://docs.kie.ai  (Market API: POST /api/v1/jobs/createTask, GET /api/v1/jobs/recordInfo)

Key lookup order: $KIE_API_KEY, then KIE_API_KEY= in ./.env, ./backend/.env, ./frontend/.env.
The key is never printed.

Examples:
  python kie.py image "Hero image ..." --aspect 16:9 --out frontend/src/assets/generated/hero.png
  python kie.py task --model kling/v2-1-standard --input '{"prompt": "..."}' --out clip.mp4
  python kie.py status <taskId>
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = 'https://api.kie.ai/api/v1/jobs'
DEFAULT_IMAGE_MODEL = 'google/nano-banana'
ENV_FILES = ['.env', 'backend/.env', 'frontend/.env']


def api_key():
    key = os.environ.get('KIE_API_KEY')
    if key:
        return key.strip()
    for path in ENV_FILES:
        if not os.path.exists(path):
            continue
        with open(path, encoding='utf-8') as fh:
            for line in fh:
                if line.strip().startswith('KIE_API_KEY='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    sys.exit('KIE_API_KEY not found. Add KIE_API_KEY=... to .env (gitignored) or export it.')


def request(method, url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        'Authorization': f'Bearer {api_key()}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as err:
        sys.exit(f'Kie API HTTP {err.code}: {err.read().decode()[:500]}')
    if payload.get('code') not in (200, None):
        sys.exit(f"Kie API error {payload.get('code')}: {payload.get('msg')}")
    return payload.get('data') or {}


def create_task(model, task_input):
    data = request('POST', f'{BASE}/createTask', {'model': model, 'input': task_input})
    task_id = data.get('taskId')
    if not task_id:
        sys.exit(f'No taskId in response: {data}')
    print(f'task {task_id} created ({model})', file=sys.stderr)
    return task_id


def wait(task_id, timeout=600, interval=4):
    start = time.time()
    while time.time() - start < timeout:
        data = request('GET', f'{BASE}/recordInfo?taskId={task_id}')
        state = data.get('state')
        if state == 'success':
            result = json.loads(data.get('resultJson') or '{}')
            print(f"done in {data.get('costTime')}s, credits used: {data.get('creditsConsumed')}", file=sys.stderr)
            return result.get('resultUrls') or []
        if state == 'fail':
            sys.exit(f"task failed: {data.get('failCode')} {data.get('failMsg')}")
        print(f'  {state}…', file=sys.stderr)
        time.sleep(interval)
    sys.exit(f'timed out after {timeout}s; check later with: kie.py status {task_id}')


def download(urls, out):
    saved = []
    for i, url in enumerate(urls):
        path = out
        if len(urls) > 1:
            root, ext = os.path.splitext(out)
            path = f'{root}-{i + 1}{ext}'
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        urllib.request.urlretrieve(url, path)
        saved.append(path)
    return saved


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)

    img = sub.add_parser('image', help='generate an image')
    img.add_argument('prompt')
    img.add_argument('--model', default=DEFAULT_IMAGE_MODEL)
    img.add_argument('--aspect', default='16:9', help='e.g. 1:1, 16:9, 9:16, 4:3')
    img.add_argument('--format', default='png', choices=['png', 'jpeg'])
    img.add_argument('--out', help='download result here (otherwise print URLs)')

    task = sub.add_parser('task', help='any Market model (video, upscale, edit) with a raw input object')
    task.add_argument('--model', required=True)
    task.add_argument('--input', required=True, help='JSON object passed as "input"')
    task.add_argument('--out')

    st = sub.add_parser('status', help='check or resume a task')
    st.add_argument('task_id')
    st.add_argument('--out')

    args = ap.parse_args()
    if args.cmd == 'image':
        task_id = create_task(args.model, {
            'prompt': args.prompt,
            'output_format': args.format,
            'image_size': args.aspect,
            'aspect_ratio': args.aspect,
        })
    elif args.cmd == 'task':
        task_id = create_task(args.model, json.loads(args.input))
    else:
        task_id = args.task_id

    urls = wait(task_id)
    if args.out:
        for p in download(urls, args.out):
            print(p)
    else:
        print('\n'.join(urls))
    print('Note: result URLs are temporary. Download anything you keep.', file=sys.stderr)


if __name__ == '__main__':
    main()
