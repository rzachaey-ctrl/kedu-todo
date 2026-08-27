'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Filter = 'all' | 'active' | 'done';
type Priority = 'high' | 'medium' | 'low';
type Task = { id: number; title: string; done: boolean; priority: Priority; label: string };

const starterTasks: Task[] = [
  { id: 1, title: '整理本周研究进展', done: true, priority: 'high', label: '工作' },
  { id: 2, title: '完成无人机巡检模块测试', done: false, priority: 'high', label: '项目' },
  { id: 3, title: '阅读 30 分钟', done: false, priority: 'medium', label: '成长' },
  { id: 4, title: '晚饭后散步', done: false, priority: 'low', label: '生活' },
];

const priorityText = { high: '重要', medium: '一般', low: '轻松' };

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(starterTasks);
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem('daymark-tasks');
      if (saved) try { setTasks(JSON.parse(saved)); } catch { localStorage.removeItem('daymark-tasks'); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('daymark-tasks', JSON.stringify(tasks)); }, [tasks, hydrated]);

  const doneCount = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.done : !task.done)), [tasks, filter]);

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setTasks((items) => [{ id: Date.now(), title, done: false, priority, label: '今日' }, ...items]);
    setDraft('');
  }
  const toggleTask = (id: number) => setTasks((items) => items.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  const removeTask = (id: number) => setTasks((items) => items.filter((task) => task.id !== id));

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="刻度待办首页"><span className="brand-mark">✓</span><span>刻度</span></a>
        <div className="date-chip"><span className="status-dot" /><span>今天 · 保持专注</span></div>
        <button className="avatar" aria-label="个人菜单">RH</button>
      </header>

      <div className="workspace" id="top">
        <aside className="sidebar" aria-label="清单导航">
          <p className="section-label">视图</p>
          <nav className="nav-list">
            <button className="nav-item active"><span>◉</span>今天<span className="nav-count">{tasks.length}</span></button>
            <button className="nav-item"><span>◎</span>即将到来</button>
            <button className="nav-item"><span>◇</span>收集箱</button>
          </nav>
          <p className="section-label list-label">清单</p>
          <div className="nav-list compact">
            <button className="nav-item"><i className="list-dot work" />工作</button>
            <button className="nav-item"><i className="list-dot project" />项目</button>
            <button className="nav-item"><i className="list-dot life" />生活</button>
          </div>
          <blockquote className="sidebar-quote">“清晰的一天，<br />从一件小事开始。”</blockquote>
        </aside>

        <section className="content">
          <div className="heading-row">
            <div><p className="eyebrow">MY DAY / 今日</p><h1>把今天，<br /><em>稳稳完成。</em></h1></div>
            <div className="progress-orbit" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><div><strong>{progress}</strong><span>%</span></div></div>
          </div>

          <form className="task-composer" onSubmit={addTask}>
            <button type="submit" className="add-button" aria-label="添加任务">＋</button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="写下下一件要做的事…" aria-label="新任务名称" />
            <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} aria-label="任务优先级">
              <option value="high">重要</option><option value="medium">一般</option><option value="low">轻松</option>
            </select>
            <kbd>↵</kbd>
          </form>

          <div className="list-toolbar">
            <div className="filters" aria-label="筛选任务">
              {(['all', 'active', 'done'] as Filter[]).map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{{ all: '全部', active: '进行中', done: '已完成' }[item]}</button>)}
            </div>
            <span>{doneCount} / {tasks.length} 已完成</span>
          </div>

          <div className="task-list" aria-live="polite">
            {visibleTasks.map((task) => (
              <article className={`task-card ${task.done ? 'is-done' : ''}`} key={task.id}>
                <button className="check" onClick={() => toggleTask(task.id)} aria-label={`${task.done ? '恢复' : '完成'}任务：${task.title}`}>{task.done ? '✓' : ''}</button>
                <div className="task-copy"><h2>{task.title}</h2><p><span className={`priority ${task.priority}`} />{priorityText[task.priority]} · {task.label}</p></div>
                <button className="delete" onClick={() => removeTask(task.id)} aria-label={`删除任务：${task.title}`}>×</button>
              </article>
            ))}
            {visibleTasks.length === 0 && <div className="empty-state"><span>✓</span><h2>{filter === 'done' ? '还没有已完成的任务' : '这一栏已经清空'}</h2><p>在上方写下下一件事，继续推进今天。</p></div>}
          </div>
        </section>

        <aside className="focus-panel">
          <div><p className="eyebrow light">TODAY&apos;S PACE</p><h2>今日节奏</h2><p className="focus-summary">完成 <strong>{doneCount}</strong> 件，再专注推进 <strong>{Math.max(tasks.length - doneCount, 0)}</strong> 件。</p></div>
          <div className="track" aria-label={`今日进度 ${progress}%`}><div className="track-fill" style={{ height: `${Math.max(progress, 4)}%` }} /><span className="track-start">开始</span><span className="track-end">收工</span></div>
          <div className="focus-note"><span>⌁</span><p>一次只做一件事，完成比完美更重要。</p></div>
        </aside>
      </div>
    </main>
  );
}
