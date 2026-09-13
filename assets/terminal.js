/* ============================================================
   TERMINAL — interactive command shell overlay
   Opens from the persistent nav "terminal" button. Talks to the
   page's own data (PROJECTS, SKILLS, openModal) so 'open <x>'
   actually navigates the real site instead of just printing text.
   Save as: assets/terminal.js
   Load AFTER the main inline <script> (needs PROJECTS/SKILLS/openModal
   to already exist), e.g. right before </body>:
     <script defer src="assets/terminal.js"></script>
   ============================================================ */
(function terminal(){
  const openBtn = document.getElementById('terminal-open-btn');
  const openBtnMobile = document.getElementById('terminal-open-btn-mobile');
  const overlay = document.getElementById('term-overlay');
  const closeBtn = document.getElementById('term-close-btn');
  const body = document.getElementById('term-body');
  const linesWrap = document.getElementById('term-lines');
  const input = document.getElementById('term-input');
  const promptEl = document.getElementById('term-prompt');
  if(!openBtn || !overlay || !input) return;

  const USER = 'usman';
  const HOST = 'portfolio';
  let cwd = []; // [] = ~ ,  ['projects'] = ~/projects
  let booted = false;
  const history = [];
  let historyIdx = -1;

  /* ---------- tiny virtual filesystem, mirrors the real site ---------- */
  const ROOT_FILES = ['about.txt', 'skills.txt', 'contact.txt', 'resume.pdf'];
  const PROJECT_FILES = (typeof PROJECTS !== 'undefined' ? PROJECTS : []).map(p => p.id + '.txt');

  function fileContent(name){
    if(name === 'about.txt'){
      return "Usman, a Computer Science student focused on graphics programming and low-level\nsystems. Interested in how things actually work: software rendering, VGA memory,\nOpenGL pipelines, shaders, GPU programming, real-time visualization.\n\nGoal: grow into a professional graphics / rendering programmer.";
    }
    if(name === 'skills.txt' && typeof SKILLS !== 'undefined'){
      return Object.entries(SKILLS).map(([cat, items]) =>
        `${cat}\n  ${items.map(i => i.n).join(', ')}`
      ).join('\n\n');
    }
    if(name === 'contact.txt'){
      return "email:    usmanjgraphics@gmail.com\ngithub:   github.com/UsmanJ-Graphics\nlinkedin: linkedin.com/in/usman-osman-500480405\nstatus:   available for graphics / rendering opportunities";
    }
    const proj = (typeof PROJECTS !== 'undefined' ? PROJECTS : []).find(p => (p.id + '.txt') === name);
    if(proj){
      return `${proj.name}\nstack: ${proj.stack.join(', ')}\nstatus: ${proj.status}\n\n${proj.desc}`;
    }
    return null;
  }

  /* ---------- output helpers ---------- */
  function line(text, cls){
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    linesWrap.appendChild(div);
  }
  function raw(html, cls){
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    linesWrap.appendChild(div);
  }
  function pre(text){
    const p = document.createElement('pre');
    p.textContent = text;
    linesWrap.appendChild(p);
  }
  function echo(cmdText){
    raw(`<span class="term-prompt-inline">${promptString()}</span>${escapeHtml(cmdText)}`, 'echo');
  }
  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function scrollToBottom(){
    body.scrollTop = body.scrollHeight;
  }
  function promptString(){
    const path = cwd.length ? '~/' + cwd.join('/') : '~';
    return `${USER}@${HOST}:${path}$ `;
  }
  function refreshPrompt(){
    promptEl.textContent = promptString();
  }

  /* ---------- ascii banner + neofetch-style summary ---------- */
  const BANNER =
`        +------------------+
       /|                 /|
      / |                / |
     +------------------+  |
     |  |                |  |
     |  +----------------|--+
     | /                 | /
     |/                  |/
     +------------------+
`;

  function printBoot(){
    pre(BANNER);
    line(`${USER}OS (${USER}-terminal)`, 'accent');
    line('');
    const uptimeStart = new Date('2024-09-01');
    const days = Math.max(1, Math.floor((Date.now() - uptimeStart) / 86400000));
    const kv = [
      ['OS', `${cap(USER)}OS 1.0 (Ubuntu 22.04 LTS base)`],
      ['Host', `portfolio.${USER} (localhost)`],
      ['Kernel', '6.x.x-generic (Graphics-Programmer Intellect)'],
      ['Uptime', `${days} days`],
      ['Shell', 'zsh 5.8'],
      ['Resolution', `${screen.width}x${screen.height}`],
      ['DE', `${USER}-desktop`],
      ['WM', 'AwesomeWM'],
      ['Terminal', `${USER}-terminal`],
      ['CPU', 'C++ Compiler (12) @ 3.5GHz'],
      ['GPU', 'OpenGL 3.3 Core (Real-Time Renderer)'],
      ['Memory', 'Shader Programs / 128GB RAM (Used: ~30GB)']
    ];
    kv.forEach(([k,v]) => raw(`<b>${k}:</b> ${escapeHtml(v)}`, 'out term-kv'));
    line('');
    line(`Type 'help' to see available commands.`, 'dim');
    line('');
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- section / project navigation ---------- */
  const SECTION_ALIASES = {
    home: 'hero', hero: 'hero',
    work: 'work', projects: 'work',
    toolchain: 'toolchain', skills: 'toolchain',
    about: 'about',
    lab: 'lab',
    certifications: 'certifications', certs: 'certifications',
    contact: 'contact'
  };

  function openTarget(arg){
    if(!arg){ line('usage: open <section|project>  (try: open work, open twincity3d, open resume)', 'out'); return; }
    const key = arg.toLowerCase();

    if(key === 'resume' || key === 'cv'){
      line('opening resume…', 'accent');
      closeTerminal();
      const a = document.createElement('a');
      a.href = 'assets/Usman-Javed-CV.pdf'; a.download = '';
      document.body.appendChild(a); a.click(); a.remove();
      return;
    }

    if(SECTION_ALIASES[key]){
      const id = SECTION_ALIASES[key];
      const el = document.getElementById(id);
      if(el){
        line(`opening #${id}…`, 'accent');
        closeTerminal();
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
        return;
      }
    }

    if(typeof PROJECTS !== 'undefined'){
      const idx = PROJECTS.findIndex(p => p.id === key || p.name.toLowerCase().includes(key));
      if(idx !== -1 && typeof openModal === 'function'){
        line(`opening project: ${PROJECTS[idx].name}…`, 'accent');
        closeTerminal();
        setTimeout(() => {
          document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => openModal(PROJECTS[idx], idx), 350);
        }, 250);
        return;
      }
    }
    line(`open: no section or project matching '${arg}'. Try: home, work, toolchain, about, lab, certifications, contact — or a project name.`, 'err');
  }

  /* ---------- fortune / talk ---------- */
  const FORTUNES = [
    'The best debugger is a good night\'s sleep.',
    'A pixel out of place is still a pixel you own.',
    'Every framebuffer tells a story; most of them are bugs.',
    'Ship it, then understand why it worked.',
    'Real-time means the bug happens sixty times a second.',
    'Assembly teaches patience. Patience teaches assembly.',
    'The GPU does not care about your feelings, only your matrices.'
  ];
  const TALKS = [
    'usman: currently deep in a rendering pipeline, send snacks.',
    'usman: ask me about OpenGL, I will not stop talking.',
    'usman: still faster than the compiler on a bad day.',
    'usman: rebuilding the wheel, but the wheel is a GPU now.'
  ];

  /* ---------- man pages ---------- */
  const MAN = {
    help: 'help — list all available commands.',
    whoami: 'whoami — print a short bio.',
    clear: 'clear — clear the terminal screen.',
    exit: 'exit — close the terminal window.',
    date: 'date — print the current date and time.',
    cal: 'cal — print a small calendar for the current month.',
    pwd: 'pwd — print the current working directory.',
    ls: 'ls — list files in the current directory.',
    cd: 'cd <dir> — change directory. Try: cd projects, cd ..',
    cat: 'cat <file> — print a file\'s contents. Try: cat about.txt',
    open: 'open <section|project> — navigate the real site to that section or project. Try: open work, open twincity3d, open resume',
    man: 'man <cmd> — show the manual page for a command.',
    ping: 'ping <host> — simulate pinging a host.',
    fortune: 'fortune — print a small random quip.',
    talk: 'talk usman — get a one-line reply.',
    'sudo': 'sudo rm -rf / — nice try.'
  };

  /* ---------- command dispatch ---------- */
  function run(cmdline){
    const trimmed = cmdline.trim();
    echo(cmdline);
    if(!trimmed){ return; }
    history.push(trimmed);
    historyIdx = history.length;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch(cmd){
      case 'help':
        line('Available commands:', 'accent');
        line('help, whoami, clear, exit, date, cal, pwd, ls, cd <dir>, cat <file>,', 'out');
        line('open <section|project>, man <cmd>, ping <host>, fortune, talk usman,', 'out');
        line('sudo rm -rf /', 'out');
        break;

      case 'whoami':
        line(`${USER} — Graphics Programmer & Computer Science Student.`, 'out');
        line('Building real-time rendering systems from first principles.', 'out');
        break;

      case 'clear':
        linesWrap.innerHTML = '';
        break;

      case 'exit':
        line('closing terminal…', 'dim');
        closeTerminal();
        break;

      case 'date':
        line(new Date().toString(), 'out');
        break;

      case 'cal':
        pre(monthCalendar());
        break;

      case 'pwd':
        line(cwd.length ? '~/' + cwd.join('/') : '~', 'out');
        break;

      case 'ls': {
        const entries = cwd.length ? PROJECT_FILES : [...ROOT_FILES, 'projects/'];
        line(entries.join('  '), 'out');
        break;
      }

      case 'cd': {
        const target = arg.trim();
        if(!target || target === '~'){ cwd = []; }
        else if(target === '..' || target === '../'){ cwd = []; }
        else if((target === 'projects' || target === 'projects/') && cwd.length === 0){ cwd = ['projects']; }
        else { line(`cd: no such file or directory: ${target}`, 'err'); break; }
        refreshPrompt();
        break;
      }

      case 'cat': {
        if(!arg){ line('usage: cat <file>', 'out'); break; }
        let name = arg.replace(/^projects\//, '');
        if(name === 'resume.pdf'){ line("cat: resume.pdf: binary file — try: open resume", 'err'); break; }
        const content = fileContent(name);
        if(content){ content.split('\n').forEach(l => line(l, 'out')); }
        else { line(`cat: ${arg}: No such file or directory`, 'err'); }
        break;
      }

      case 'open':
        openTarget(arg.trim());
        break;

      case 'man':
        if(!arg){ line('usage: man <command>', 'out'); break; }
        line(MAN[arg.trim().toLowerCase()] || `No manual entry for ${arg}`, 'out');
        break;

      case 'ping':
        if(!arg){ line('usage: ping <host>', 'out'); break; }
        simulatePing(arg.trim());
        break;

      case 'fortune':
        line(FORTUNES[Math.floor(Math.random() * FORTUNES.length)], 'accent');
        break;

      case 'talk':
        if(arg.trim().toLowerCase() === 'usman'){
          line(TALKS[Math.floor(Math.random() * TALKS.length)], 'accent');
        } else {
          line(`talk: try 'talk usman'`, 'out');
        }
        break;

      case 'sudo':
        if(trimmed.toLowerCase().includes('rm -rf /')){
          line('Nice try. This portfolio has trust issues now.', 'err');
        } else {
          line(`sudo: ${USER} is not in the sudoers file. This incident will be reported.`, 'err');
        }
        break;

      default:
        line(`command not found: ${cmd} — type 'help' for a list of commands.`, 'err');
    }
    scrollToBottom();
  }

  function monthCalendar(){
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startDow = first.getDay();
    const title = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    let out = title.padStart(Math.floor((20 + title.length) / 2), ' ') + '\nSu Mo Tu We Th Fr Sa\n';
    let row = '   '.repeat(startDow);
    for(let d = 1; d <= daysInMonth; d++){
      const marker = d === now.getDate() ? String(d).padStart(2,' ') : String(d).padStart(2,' ');
      row += marker + ' ';
      if((startDow + d) % 7 === 0){ out += row.trimEnd() + '\n'; row = ''; }
    }
    if(row.trim()) out += row.trimEnd() + '\n';
    return out;
  }

  function simulatePing(host){
    line(`PING ${host}: 56 data bytes`, 'out');
    let sent = 0;
    const iv = setInterval(() => {
      sent++;
      const t = (12 + Math.random() * 40).toFixed(1);
      line(`64 bytes from ${host}: icmp_seq=${sent} ttl=57 time=${t} ms`, 'dim');
      scrollToBottom();
      if(sent >= 4){
        clearInterval(iv);
        line(`--- ${host} ping statistics ---`, 'out');
        line('4 packets transmitted, 4 received, 0% packet loss', 'out');
        scrollToBottom();
      }
    }, 450);
  }

  /* ---------- open / close ---------- */
  function openTerminal(){
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if(!booted){ printBoot(); booted = true; }
    refreshPrompt();
    setTimeout(() => input.focus(), 50);
    document.body.style.overflow = 'hidden';
  }
  function closeTerminal(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    openBtn.focus({ preventScroll: true });
  }

  openBtn.addEventListener('click', openTerminal);
  openBtnMobile?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.remove('open');
    document.getElementById('burger')?.setAttribute('aria-expanded', 'false');
    openTerminal();
  });
  closeBtn?.addEventListener('click', closeTerminal);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) closeTerminal(); });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && overlay.classList.contains('open')) closeTerminal();
  });
  body.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const val = input.value;
      input.value = '';
      run(val);
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      if(historyIdx > 0){ historyIdx--; input.value = history[historyIdx] || ''; }
    } else if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(historyIdx < history.length - 1){ historyIdx++; input.value = history[historyIdx] || ''; }
      else { historyIdx = history.length; input.value = ''; }
    }
  });
})();
