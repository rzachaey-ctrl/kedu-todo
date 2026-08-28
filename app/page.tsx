'use client';

import { FormEvent, useEffect, useState } from 'react';

type Filter = 'all' | 'active' | 'done';
type Priority = 'high' | 'medium' | 'low';
type Category = '工作' | '项目' | '生活' | '成长';
type View = 'today' | 'upcoming' | 'inbox' | Category;
type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  category: Category;
  dueDate: string;
  createdAt: number;
};

const categories: Category[] = ['工作', '项目', '生活', '成长'];
const priorityText: Record<Priority, string> = { high: '重要', medium: '一般', low: '轻松' };
const viewCopy: Record<View, { eyebrow: string; title: string; accent: string }> = {
  today: { eyebrow: 'MY DAY / 今日', title: '把今天，', accent: '稳稳完成。' },
  upcoming: { eyebrow: 'UPCOMING / 即将到来', title: '提前安排，', accent: '从容推进。' },
  inbox: { eyebrow: 'INBOX / 收集箱', title: '先记下来，', accent: '稍后整理。' },
  工作: { eyebrow: 'LIST / 工作', title: '聚焦工作，', accent: '逐项完成。' },
  项目: { eyebrow: 'LIST / 项目', title: '推进项目，', accent: '积少成多。' },
  生活: { eyebrow: 'LIST / 生活', title: '照顾生活，', accent: '保持松弛。' },
  成长: { eyebrow: 'LIST / 成长', title: '每天一点，', accent: '持续成长。' },
};

function toISODate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function todayISO() { return toISODate(new Date()); }
function tomorrowISO() { const date = new Date(); date.setDate(date.getDate() + 1); return toISODate(date); }

function initialTasks(): Task[] {
  const today = todayISO();
  const tomorrow = tomorrowISO();
  return [
    { id: 'starter-1', title: '整理本周研究进展', done: true, priority: 'high', category: '工作', dueDate: today, createdAt: 1 },
    { id: 'starter-2', title: '完成无人机巡检模块测试', done: false, priority: 'high', category: '项目', dueDate: today, createdAt: 2 },
    { id: 'starter-3', title: '阅读 30 分钟', done: false, priority: 'medium', category: '成长', dueDate: tomorrow, createdAt: 3 },
    { id: 'starter-4', title: '晚饭后散步', done: false, priority: 'low', category: '生活', dueDate: '', createdAt: 4 },
  ];
}

function normalizeTask(value: Partial<Task> & { label?: string | undefined }, index: number): Task {
  const fallbackCategory = categories.includes(value.category as Category)
    ? value.category as Category
    : categories.includes(value.label as Category) ? value.label as Category : '工作';
  return {
    id: String(value.id ?? `migrated-${index}`),
    title: String(value.title ?? '未命名任务'),
    done: Boolean(value.done),
    priority: ['high', 'medium', 'low'].includes(String(value.priority)) ? value.priority as Priority : 'medium',
    category: fallbackCategory,
    dueDate: typeof value.dueDate === 'string' ? value.dueDate : todayISO(),
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now() + index,
  };
}

function formatDate(date: string) {
  if (!date) return '未安排日期';
  if (date === todayISO()) return '今天';
  if (date === tomorrowISO()) return '明天';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
    .format(new Date(`${date}T12:00:00`));
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<View>('today');
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('工作');
  const [dueDate, setDueDate] = useState(todayISO);
  const [editing, setEditing] = useState<Task | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem('daymark-tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Array<Partial<Task> & { label?: string }>;
          setTasks(parsed.map(normalizeTask));
        } catch {
          localStorage.removeItem('daymark-tasks');
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('daymark-tasks', JSON.stringify(tasks));
  }, [tasks, hydrated]);

  function tasksForView(candidateView: View) {
    const today = todayISO();
    if (candidateView === 'today') return tasks.filter((task) => task.dueDate === today);
    if (candidateView === 'upcoming') return tasks.filter((task) => task.dueDate > today);
    if (candidateView === 'inbox') return tasks.filter((task) => !task.dueDate);
    return tasks.filter((task) => task.category === candidateView);
  }

  const scopedTasks = tasksForView(view);
  const visibleTasks = scopedTasks.filter((task) => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  const todayTasks = tasks.filter((task) => task.dueDate === todayISO());
  const todayDone = todayTasks.filter((task) => task.done).length;
  const progress = todayTasks.length ? Math.round(todayDone / todayTasks.length * 100) : 0;
  const viewDone = scopedTasks.filter((task) => task.done).length;

  function announce(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }

  function selectView(nextView: View) {
    setView(nextView);
    setFilter('all');
    setMenuOpen(false);
    if (nextView === 'inbox') setDueDate('');
    else if (nextView === 'upcoming') setDueDate(tomorrowISO());
    else if (nextView === 'today') setDueDate(todayISO());
    else setCategory(nextView);
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) { announce('先写下任务名称'); return; }
    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      done: false,
      priority,
      category,
      dueDate,
      createdAt: Date.now(),
    };
    setTasks((items) => [task, ...items]);
    setDraft('');
    announce('任务已添加');
  }

  function toggleTask(id: string) {
    setTasks((items) => items.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function removeTask(id: string) {
    const removed = tasks.find((task) => task.id === id);
    setTasks((items) => items.filter((task) => task.id !== id));
    announce(removed ? `已删除“${removed.title}”` : '任务已删除');
  }

  function saveEditing(event: FormEvent) {
    event.preventDefault();
    if (!editing?.title.trim()) { announce('任务名称不能为空'); return; }
    setTasks((items) => items.map((task) => task.id === editing.id ? { ...editing, title: editing.title.trim() } : task));
    setEditing(null);
    announce('任务已更新');
  }

  function clearCompleted() {
    const completed = tasks.filter((task) => task.done).length;
    if (!completed) { announce('还没有已完成的任务'); return; }
    if (window.confirm(`确定删除 ${completed} 个已完成任务吗？`)) {
      setTasks((items) => items.filter((task) => !task.done));
      announce('已清理完成任务');
    }
  }

  function resetTasks() {
    if (window.confirm('确定恢复示例任务吗？当前任务会被替换。')) {
      setTasks(initialTasks());
      setView('today');
      setMenuOpen(false);
      announce('已恢复示例任务');
    }
  }

  function exportTasks() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `刻度任务-${todayISO()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
    announce('任务备份已下载');
  }

  const counts = {
    today: tasksForView('today').length,
    upcoming: tasksForView('upcoming').length,
    inbox: tasksForView('inbox').length,
  };

  return (
    <main className="page-shell" onClick={() => menuOpen && setMenuOpen(false)}>
      <header className="topbar">
        <button className="brand brand-button" onClick={() => selectView('today')} aria-label="返回今日任务"><span className="brand-mark">✓</span><span>刻度</span></button>
        <button className="date-chip" onClick={() => selectView('today')}><span className="status-dot" /><span>{new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())} · 保持专注</span></button>
        <div className="profile-wrap" onClick={(event) => event.stopPropagation()}>
          <button className="avatar" onClick={() => setMenuOpen((open) => !open)} aria-label="个人菜单" aria-expanded={menuOpen}>RH</button>
          {menuOpen && <div className="profile-menu"><strong>本机任务</strong><span>{tasks.length} 个任务保存在此浏览器</span><button onClick={exportTasks}>导出 JSON 备份</button><button onClick={clearCompleted}>清理已完成任务</button><button className="danger-action" onClick={resetTasks}>恢复示例任务</button></div>}
        </div>
      </header>

      <div className="workspace" id="top">
        <aside className="sidebar" aria-label="清单导航">
          <p className="section-label">视图</p>
          <nav className="nav-list">
            <button className={`nav-item ${view === 'today' ? 'active' : ''}`} onClick={() => selectView('today')}><span>◉</span>今天<span className="nav-count">{counts.today}</span></button>
            <button className={`nav-item ${view === 'upcoming' ? 'active' : ''}`} onClick={() => selectView('upcoming')}><span>◎</span>即将到来<span className="nav-count">{counts.upcoming}</span></button>
            <button className={`nav-item ${view === 'inbox' ? 'active' : ''}`} onClick={() => selectView('inbox')}><span>◇</span>收集箱<span className="nav-count">{counts.inbox}</span></button>
          </nav>
          <p className="section-label list-label">清单</p>
          <div className="nav-list compact">
            {categories.map((item) => <button key={item} className={`nav-item ${view === item ? 'active' : ''}`} onClick={() => selectView(item)}><i className={`list-dot ${item}`} />{item}<span className="nav-count">{tasksForView(item).length}</span></button>)}
          </div>
          <blockquote className="sidebar-quote">“清晰的一天，<br />从一件小事开始。”</blockquote>
        </aside>

        <section className="content">
          <div className="heading-row">
            <div><p className="eyebrow">{viewCopy[view].eyebrow}</p><h1>{viewCopy[view].title}<br /><em>{viewCopy[view].accent}</em></h1></div>
            <div className="progress-orbit" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><div><strong>{progress}</strong><span>% 今日</span></div></div>
          </div>

          <form className="task-composer expanded" onSubmit={addTask}>
            <button type="submit" className="add-button" aria-label="添加任务">＋</button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="写下下一件要做的事…" aria-label="新任务名称" />
            <div className="composer-options">
              <select value={category} onChange={(event) => setCategory(event.target.value as Category)} aria-label="任务清单">{categories.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} aria-label="任务优先级"><option value="high">重要</option><option value="medium">一般</option><option value="low">轻松</option></select>
              <input className="date-input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="任务日期" />
            </div>
          </form>

          <div className="list-toolbar">
            <div className="filters" aria-label="筛选任务">{(['all', 'active', 'done'] as Filter[]).map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{{ all: '全部', active: '进行中', done: '已完成' }[item]}</button>)}</div>
            <div className="toolbar-summary"><span>{viewDone} / {scopedTasks.length} 已完成</span>{viewDone > 0 && <button onClick={clearCompleted}>清理</button>}</div>
          </div>

          <div className="task-list" aria-live="polite">
            {visibleTasks.map((task) => (
              <article className={`task-card ${task.done ? 'is-done' : ''}`} key={task.id}>
                <button className="check" onClick={() => toggleTask(task.id)} aria-label={`${task.done ? '恢复' : '完成'}任务：${task.title}`}>{task.done ? '✓' : ''}</button>
                <button className="task-copy task-edit-trigger" onClick={() => setEditing({ ...task })} aria-label={`编辑任务：${task.title}`}>
                  <h2>{task.title}</h2><p><span className={`priority ${task.priority}`} />{priorityText[task.priority]} · {task.category} · {formatDate(task.dueDate)}</p>
                </button>
                <button className="edit-button" onClick={() => setEditing({ ...task })} aria-label={`编辑任务：${task.title}`}>编辑</button>
                <button className="delete" onClick={() => removeTask(task.id)} aria-label={`删除任务：${task.title}`}>×</button>
              </article>
            ))}
            {visibleTasks.length === 0 && <div className="empty-state"><span>✓</span><h2>{filter === 'done' ? '还没有已完成的任务' : '这里暂时没有任务'}</h2><p>在上方写下下一件事，或切换其他视图。</p></div>}
          </div>
        </section>

        <aside className="focus-panel">
          <div><p className="eyebrow light">TODAY&apos;S PACE</p><h2>今日节奏</h2><p className="focus-summary">完成 <strong>{todayDone}</strong> 件，再专注推进 <strong>{Math.max(todayTasks.length - todayDone, 0)}</strong> 件。</p></div>
          <div className="track" aria-label={`今日进度 ${progress}%`}><div className="track-fill" style={{ height: `${Math.max(progress, 4)}%` }} /><span className="track-start">开始</span><span className="track-end">收工</span></div>
          <div className="focus-note"><span>⌁</span><p>一次只做一件事，完成比完美更重要。</p></div>
        </aside>
      </div>

      {editing && <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}><section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">EDIT TASK</p><h2 id="edit-title">编辑任务</h2></div><button onClick={() => setEditing(null)} aria-label="关闭编辑窗口">×</button></div><form onSubmit={saveEditing}><label>任务名称<input autoFocus value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label><div className="edit-grid"><label>所属清单<select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value as Category })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>优先级<select value={editing.priority} onChange={(event) => setEditing({ ...editing, priority: event.target.value as Priority })}><option value="high">重要</option><option value="medium">一般</option><option value="low">轻松</option></select></label></div><label>安排日期<input type="date" value={editing.dueDate} onChange={(event) => setEditing({ ...editing, dueDate: event.target.value })} /></label><div className="modal-actions"><button type="button" onClick={() => setEditing(null)}>取消</button><button className="primary-action" type="submit">保存修改</button></div></form></section></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
