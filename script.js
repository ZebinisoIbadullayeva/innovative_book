/* ==========================================================================
   KASRLAR — interaktiv elektron darslik
   Barcha interaktiv mantiq: koʻrgazmali grafikalar, laboratoriyalar,
   savollar, oʻyinlar, yakuniy test, javoblar kaliti.
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     0. YORDAMCHI FUNKSIYALAR
     ---------------------------------------------------------------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Sonlarning oʻzbekcha nomlari (kasrni oʻqish uchun)
  const NAMES = ['nol', 'bir', 'ikki', 'uch', 'toʻrt', 'besh', 'olti', 'yetti',
    'sakkiz', 'toʻqqiz', 'oʻn', 'oʻn bir', 'oʻn ikki', 'oʻn uch', 'oʻn toʻrt',
    'oʻn besh', 'oʻn olti', 'oʻn yetti', 'oʻn sakkiz', 'oʻn toʻqqiz', 'yigirma'];

  const nameOf = (n) => NAMES[n] || String(n);

  /** Kasrni oʻzbekcha oʻqish: 3/4 → "toʻrtdan uch" */
  function readFraction(num, den) {
    if (den === 1) return nameOf(num) + ' butun';
    if (num === den) return 'bir butun';
    return nameOf(den) + 'dan ' + nameOf(num);
  }

  /** Oʻnli kasr, vergul bilan (oʻzbekcha yozuv) */
  const toDecimal = (num, den) => {
    const v = num / den;
    return (Math.round(v * 1000) / 1000).toString().replace('.', ',');
  };

  /* ----------------------------------------------------------------------
     1. KOʻRGAZMALI GRAFIKALAR (SVG generatorlari)
     ---------------------------------------------------------------------- */

  /** Doira sektori uchun yoʻl (path) */
  function slicePath(cx, cy, r, startDeg, endDeg) {
    const rad = (d) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(startDeg));
    const y1 = cy + r * Math.sin(rad(startDeg));
    const x2 = cx + r * Math.cos(rad(endDeg));
    const y2 = cy + r * Math.sin(rad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  /**
   * Pirog (doira) koʻrinishidagi kasr.
   * num > den boʻlsa bir nechta doira chiziladi (notoʻgʻri kasr).
   */
  function pieSVG(num, den, color) {
    const fill = color || 'var(--viz-fill)';
    const R = 54, PAD = 6, D = (R + PAD) * 2;
    const wholes = Math.max(1, Math.ceil(num / den));
    const W = wholes * D + (wholes - 1) * 10;
    let s = `<svg viewBox="0 0 ${W} ${D}" role="img" aria-label="${num}/${den} kasrning rasmi">`;
    let left = num;

    for (let w = 0; w < wholes; w++) {
      const cx = w * (D + 10) + R + PAD;
      const cy = R + PAD;
      s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--viz-empty)" stroke="var(--viz-stroke)" stroke-width="2.5"/>`;
      const step = 360 / den;
      for (let i = 0; i < den; i++) {
        if (left > 0) {
          s += `<path d="${slicePath(cx, cy, R, i * step, (i + 1) * step)}" fill="${fill}" opacity="0.9"/>`;
          left--;
        }
        s += `<line x1="${cx}" y1="${cy}" x2="${cx + R * Math.cos(((i * step - 90) * Math.PI) / 180)}" y2="${cy + R * Math.sin(((i * step - 90) * Math.PI) / 180)}" stroke="var(--viz-stroke)" stroke-width="2"/>`;
      }
      s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--viz-stroke)" stroke-width="2.5"/>`;
    }
    return s + '</svg>';
  }

  /** Lenta (bar) koʻrinishidagi kasr */
  function barSVG(num, den, color) {
    const fill = color || 'var(--viz-fill)';
    const W = 300, H = 54, PAD = 3;
    const wholes = Math.max(1, Math.ceil(num / den));
    const totalW = W * wholes + (wholes - 1) * 8;
    let s = `<svg viewBox="0 0 ${totalW} ${H}" role="img" aria-label="${num}/${den} kasrning lentadagi rasmi">`;
    let left = num;

    for (let w = 0; w < wholes; w++) {
      const ox = w * (W + 8);
      const seg = W / den;
      for (let i = 0; i < den; i++) {
        const filled = left > 0;
        if (filled) left--;
        s += `<rect x="${ox + i * seg + PAD}" y="${PAD}" width="${seg - PAD * 2}" height="${H - PAD * 2}" rx="5"
                fill="${filled ? fill : 'var(--viz-empty)'}" stroke="var(--viz-stroke)" stroke-width="2"/>`;
      }
    }
    return s + '</svg>';
  }

  /** Sahifadagi barcha [data-viz] elementlarini chizadi */
  function renderAllViz(root) {
    $$('[data-viz]', root).forEach((el) => {
      const num = parseInt(el.dataset.num, 10);
      const den = parseInt(el.dataset.den, 10);
      if (isNaN(num) || isNaN(den)) return;
      el.innerHTML = el.dataset.viz === 'bar' ? barSVG(num, den) : pieSVG(num, den);
    });
  }

  /* ----------------------------------------------------------------------
     2. LABORATORIYA 1 — kasr konstruktori
     ---------------------------------------------------------------------- */
  function initLab1() {
    const box = $('#lab1');
    if (!box) return;

    const state = { num: 3, den: 4 };
    const elNum = $('#labNum'), elDen = $('#labDen');
    const pie = $('#labPie'), bar = $('#labBar');
    const roFrac = $('#roFrac'), roRead = $('#roRead'), roType = $('#roType'), roDec = $('#roDec');
    const hint = $('#labHint');

    function draw() {
      elNum.textContent = state.num;
      elDen.textContent = state.den;
      pie.innerHTML = pieSVG(state.num, state.den);
      bar.innerHTML = barSVG(state.num, state.den);
      roFrac.textContent = state.num + '/' + state.den;
      roRead.textContent = readFraction(state.num, state.den);
      roDec.textContent = toDecimal(state.num, state.den);

      if (state.num < state.den) roType.textContent = 'toʻgʻri kasr';
      else if (state.num === state.den) roType.textContent = 'butun (= 1)';
      else roType.textContent = 'notoʻgʻri kasr';

      let msg = '';
      if (state.num === state.den) {
        msg = '🎉 Surat va maxraj teng — bu butun bir dona, yaʼni 1!';
      } else if (state.num > state.den) {
        const w = Math.floor(state.num / state.den), r = state.num % state.den;
        msg = `📌 Notoʻgʻri kasr. Aralash son koʻrinishi: ${w}${r ? ' ' + r + '/' + state.den : ''}`;
      } else {
        const g = gcd(state.num, state.den);
        msg = g > 1
          ? `✂️ Bu kasrni qisqartirish mumkin: ${state.num}/${state.den} = ${state.num / g}/${state.den / g}`
          : '✅ Bu kasr eng sodda koʻrinishda — qisqarmaydi.';
      }
      hint.textContent = msg;
    }

    $$('[data-step]', box).forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.step;
        const dir = parseInt(btn.dataset.dir, 10);
        const min = key === 'den' ? 1 : 0;
        const max = key === 'den' ? 12 : 24;
        state[key] = Math.min(max, Math.max(min, state[key] + dir));
        draw();
      });
    });

    draw();
  }

  /* ----------------------------------------------------------------------
     3. SON NURI
     ---------------------------------------------------------------------- */
  function initNumberLine() {
    const box = $('#numberLine');
    if (!box) return;

    const W = 720, H = 210, X0 = 50, X1 = W - 50;
    const rows = [
      { den: 2, y: 58, color: 'var(--blue)' },
      { den: 3, y: 118, color: 'var(--amber)' },
      { den: 4, y: 178, color: 'var(--green)' }
    ];

    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Son oʻqida 1/2, 1/3 va 1/4 kasrlar">`;
    rows.forEach((r) => {
      s += `<line x1="${X0}" y1="${r.y}" x2="${X1}" y2="${r.y}" stroke="var(--viz-stroke)" stroke-width="3" stroke-linecap="round"/>`;
      for (let i = 0; i <= r.den; i++) {
        const x = X0 + ((X1 - X0) * i) / r.den;
        const isEnd = i === 0 || i === r.den;
        s += `<line x1="${x}" y1="${r.y - (isEnd ? 14 : 9)}" x2="${x}" y2="${r.y + (isEnd ? 14 : 9)}" stroke="${isEnd ? 'var(--ink-2)' : r.color}" stroke-width="3"/>`;
        s += `<circle cx="${x}" cy="${r.y}" r="5" fill="${r.color}"/>`;
        const label = i === 0 ? '0' : i === r.den ? '1' : i + '/' + r.den;
        s += `<text x="${x}" y="${r.y + 32}" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)">${label}</text>`;
      }
      s += `<text x="10" y="${r.y + 5}" font-size="14" font-weight="800" fill="${r.color}">1/${r.den}</text>`;
    });
    box.innerHTML = s + '</svg>';
  }

  /* ----------------------------------------------------------------------
     4. LABORATORIYA 2 — taqqoslash tarozisi
     ---------------------------------------------------------------------- */
  function initCompare() {
    const box = $('#lab2');
    if (!box) return;

    const st = { a: { num: 1, den: 2 }, b: { num: 1, den: 3 } };
    const out = {
      a: { n: $('#cmpAn'), d: $('#cmpAd'), viz: $('#cmpVizA') },
      b: { n: $('#cmpBn'), d: $('#cmpBd'), viz: $('#cmpVizB') }
    };
    const sign = $('#cmpSign'), hint = $('#cmpHint');

    function draw() {
      ['a', 'b'].forEach((k) => {
        out[k].n.textContent = st[k].num;
        out[k].d.textContent = st[k].den;
        out[k].viz.innerHTML = pieSVG(st[k].num, st[k].den, k === 'a' ? 'var(--viz-fill)' : 'var(--viz-fill-2)');
      });

      const va = st.a.num / st.a.den, vb = st.b.num / st.b.den;
      const fa = st.a.num + '/' + st.a.den, fb = st.b.num + '/' + st.b.den;

      if (Math.abs(va - vb) < 1e-9) {
        sign.textContent = '=';
        hint.textContent = `⚖️ Muvozanat! ${fa} va ${fb} — teng kasrlar, qiymati bir xil.`;
      } else if (va > vb) {
        sign.textContent = '>';
        hint.textContent = explain(fa, fb, st.a, st.b, true);
      } else {
        sign.textContent = '<';
        hint.textContent = explain(fb, fa, st.b, st.a, false);
      }
    }

    function explain(big, small, bigF, smallF) {
      if (bigF.den === smallF.den) {
        return `📘 Maxrajlar teng — surati kattasi yutdi: ${big} > ${small}.`;
      }
      if (bigF.num === smallF.num) {
        return `📘 Suratlar teng — maxraji kichigi kattaroq: ${big} > ${small}.`;
      }
      const L = lcm(bigF.den, smallF.den);
      return `📘 Umumiy maxraj ${L}: ${big} = ${(bigF.num * L) / bigF.den}/${L}, ${small} = ${(smallF.num * L) / smallF.den}/${L}. Demak ${big} > ${small}.`;
    }

    $$('[data-cmp]', box).forEach((btn) => {
      btn.addEventListener('click', () => {
        const side = btn.dataset.cmp, part = btn.dataset.part;
        const dir = parseInt(btn.dataset.dir, 10);
        const min = part === 'den' ? 1 : 0;
        st[side][part] = Math.min(12, Math.max(min, st[side][part] + dir));
        draw();
      });
    });

    draw();
  }

  /* ----------------------------------------------------------------------
     5. LABORATORIYA 3 — qisqartirish mashinasi
     ---------------------------------------------------------------------- */
  function initReducer() {
    const btn = $('#redBtn');
    if (!btn) return;
    const out = $('#redOut');

    function run() {
      const n = parseInt($('#redNum').value, 10);
      const d = parseInt($('#redDen').value, 10);
      if (!n || !d || n < 1 || d < 1) {
        out.innerHTML = '<div class="mo-step">⚠️ Ikkala katakka ham 1 dan katta butun son yozing.</div>';
        return;
      }

      const g = gcd(n, d);
      let html = '';
      if (g === 1) {
        html += `<div class="mo-step">${n} va ${d} ning umumiy boʻluvchisi (1 dan boshqa) yoʻq.</div>`;
        html += `<div class="mo-final">${n}/${d} allaqachon eng sodda koʻrinishda ✅</div>`;
      } else {
        html += `<div class="mo-step"><b>1-qadam.</b> ${n} va ${d} ning eng katta umumiy boʻluvchisi (EKUB) = <b>${g}</b></div>`;
        html += `<div class="mo-step"><b>2-qadam.</b> Suratni boʻlamiz: ${n} : ${g} = <b>${n / g}</b></div>`;
        html += `<div class="mo-step"><b>3-qadam.</b> Maxrajni boʻlamiz: ${d} : ${g} = <b>${d / g}</b></div>`;
        html += `<div class="mo-final">${n}/${d} = ${n / g}/${d / g}</div>`;
      }

      if (n > d) {
        const nn = n / g, dd = d / g;
        const w = Math.floor(nn / dd), r = nn % dd;
        html += `<div class="mo-step">ℹ️ Bu notoʻgʻri kasr. Aralash son koʻrinishi: <b>${w}${r ? ' ' + r + '/' + dd : ''}</b></div>`;
      }

      html += `<div class="mo-step">🖼 Rasmi:</div><div style="max-width:320px">${barSVG(n / g, d / g)}</div>`;
      out.innerHTML = html;
    }

    btn.addEventListener('click', run);
    [$('#redNum'), $('#redDen')].forEach((inp) =>
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); })
    );
    run();
  }

  /* ----------------------------------------------------------------------
     6. LABORATORIYA 4 — qoʻshish/ayirish mashinasi
     ---------------------------------------------------------------------- */
  function initCalc() {
    const btn = $('#opBtn');
    if (!btn) return;
    const out = $('#opOut');

    function run() {
      const an = parseInt($('#opAn').value, 10), ad = parseInt($('#opAd').value, 10);
      const bn = parseInt($('#opBn').value, 10), bd = parseInt($('#opBd').value, 10);
      const op = $('#opSign').value;

      if (isNaN(an) || isNaN(bn) || !ad || !bd) {
        out.innerHTML = '<div class="mo-step">⚠️ Barcha kataklarni toʻldiring (maxraj 0 boʻlmasin).</div>';
        return;
      }

      let html = '';
      let rn, rd;

      if (ad === bd) {
        html += `<div class="mo-step"><b>1-qadam.</b> Maxrajlar bir xil (${ad}) — umumiy maxrajga keltirish shart emas.</div>`;
        rn = op === '+' ? an + bn : an - bn;
        rd = ad;
        html += `<div class="mo-step"><b>2-qadam.</b> Suratlar bilan amal: ${an} ${op === '+' ? '+' : '−'} ${bn} = <b>${rn}</b></div>`;
      } else {
        const L = lcm(ad, bd);
        const ka = L / ad, kb = L / bd;
        html += `<div class="mo-step"><b>1-qadam.</b> Maxrajlar har xil (${ad} va ${bd}). Umumiy maxraj (EKUK) = <b>${L}</b></div>`;
        html += `<div class="mo-step"><b>2-qadam.</b> ${an}/${ad} = ${an * ka}/${L} &nbsp;(× ${ka}) &nbsp;&nbsp; ${bn}/${bd} = ${bn * kb}/${L} &nbsp;(× ${kb})</div>`;
        rn = op === '+' ? an * ka + bn * kb : an * ka - bn * kb;
        rd = L;
        html += `<div class="mo-step"><b>3-qadam.</b> ${an * ka}/${L} ${op === '+' ? '+' : '−'} ${bn * kb}/${L} = <b>${rn}/${L}</b></div>`;
      }

      if (rn < 0) {
        html += `<div class="mo-final">Natija: ${rn}/${rd} (manfiy — birinchi kasr kichikroq ekan)</div>`;
        out.innerHTML = html;
        return;
      }

      const g = gcd(rn, rd) || 1;
      let finalText = `${rn}/${rd}`;
      if (g > 1 && rn !== 0) {
        html += `<div class="mo-step"><b>Qisqartiramiz.</b> EKUB = ${g} → ${rn / g}/${rd / g}</div>`;
        finalText = `${rn / g}/${rd / g}`;
      }

      const fn = rn / g, fd = rd / g;
      if (fn > fd) {
        const w = Math.floor(fn / fd), r = fn % fd;
        finalText += ` = ${w}${r ? ' ' + r + '/' + fd : ''}`;
      } else if (fn === fd) {
        finalText += ' = 1';
      }

      html += `<div class="mo-final">${an}/${ad} ${op === '+' ? '+' : '−'} ${bn}/${bd} = ${finalText}</div>`;
      if (fn >= 0 && fd > 0 && fn <= 40) {
        html += `<div style="max-width:340px;margin-top:12px">${barSVG(fn, fd)}</div>`;
      }
      out.innerHTML = html;
    }

    btn.addEventListener('click', run);
    run();
  }

  /* ----------------------------------------------------------------------
     7. SAVOLLAR (quiz) + JAVOBLAR KALITI
     ---------------------------------------------------------------------- */
  function initQuizzes() {
    const quizzes = $$('.quiz[data-quiz]');
    const stat = $('#statQuiz');
    if (stat) stat.textContent = quizzes.length;

    quizzes.forEach((quiz, i) => {
      quiz.dataset.label = 'Savol ' + (i + 1);
      quiz.dataset.index = i + 1;
      const opts = $$('.opt', quiz);

      opts.forEach((opt) => {
        opt.addEventListener('click', () => {
          if (quiz.classList.contains('answered')) return;
          quiz.classList.add('answered');
          const isRight = opt.hasAttribute('data-ok');

          opts.forEach((o) => {
            o.disabled = true;
            if (o.hasAttribute('data-ok')) o.classList.add('is-right');
          });
          if (!isRight) opt.classList.add('is-wrong');

          if (isRight) burst(opt);

          if (!$('.q-retry', quiz)) {
            const retry = document.createElement('button');
            retry.className = 'q-retry';
            retry.textContent = '🔄 Qaytadan urinish';
            retry.addEventListener('click', () => {
              quiz.classList.remove('answered');
              opts.forEach((o) => {
                o.disabled = false;
                o.classList.remove('is-right', 'is-wrong');
              });
              retry.remove();
            });
            quiz.appendChild(retry);
          }
        });
      });
    });

    buildAnswerKey(quizzes);
  }

  /** Javoblar kalitini sahifadagi savollardan avtomatik yigʻadi */
  function buildAnswerKey(quizzes) {
    const box = $('#answerKey');
    const btn = $('#akToggle');
    if (!box || !btn) return;

    let html = '';
    quizzes.forEach((q, i) => {
      const question = $('.q-text', q).textContent.trim();
      const right = $('.opt[data-ok]', q);
      const exp = $('.q-exp', q);
      const topic = q.dataset.topic || '';
      html += `<div class="ak-item">
          <div class="ak-q">${i + 1}. ${question} ${topic ? `<span class="ak-sec">· ${topic}</span>` : ''}</div>
          <div class="ak-a">✅ Javob: ${right ? right.textContent.trim() : '—'}</div>
          ${exp ? `<div class="ak-e">${exp.innerHTML}</div>` : ''}
        </div>`;
    });
    box.innerHTML = html;

    btn.addEventListener('click', () => {
      const hidden = box.hasAttribute('hidden');
      if (hidden) box.removeAttribute('hidden');
      else box.setAttribute('hidden', '');
      btn.textContent = hidden ? 'Javoblarni yashirish' : 'Javoblarni koʻrsatish';
    });
  }

  /* ----------------------------------------------------------------------
     7b. QOIDALAR TIZIMI — avtomatik raqamlash va tezkor panel
     ---------------------------------------------------------------------- */
  function initRules() {
    const rules = $$('[data-rule]');
    if (!rules.length) return;

    const LABELS = { gold: '🏆 Oltin qoida', rule: '📘 Qoida', warn: '⚠️ Diqqat' };
    const counters = { gold: 0, rule: 0, warn: 0 };
    const collected = [];

    rules.forEach((el, i) => {
      const type = el.dataset.rule;
      counters[type] = (counters[type] || 0) + 1;
      const n = counters[type];

      el.dataset.label = LABELS[type] + (type === 'warn' ? '' : ' ' + n);
      if (!el.id) el.id = 'qoida-' + (i + 1);

      // qaysi boʻlimda joylashgani
      const section = el.closest('section[id]');
      const secTitle = section ? $('.ch-head h2', section) : null;

      collected.push({
        el: el,
        type: type,
        n: n,
        title: el.dataset.title || (($('h3', el) || {}).textContent || '').trim(),
        section: secTitle ? secTitle.textContent.replace(/^[^\wА-Яа-я]+/, '').trim() : ''
      });
    });

    // --- panelni yigʻish ---
    const list = $('#rulesList');
    const panel = $('#rulesPanel');
    const backdrop = $('#rulesBackdrop');
    const openBtn = $('#rulesBtn');
    const closeBtn = $('#rulesClose');
    if (!list || !panel) return;

    let lastSection = '';
    list.innerHTML = '';
    collected.forEach((r) => {
      if (r.section && r.section !== lastSection) {
        lastSection = r.section;
        const g = document.createElement('div');
        g.className = 'rp-group';
        g.textContent = r.section;
        list.appendChild(g);
      }
      const b = document.createElement('button');
      b.className = 'rp-item is-' + r.type;
      b.innerHTML = `<span class="rp-badge">${r.type === 'gold' ? '🏆' : r.type === 'warn' ? '⚠️' : r.n}</span><span>${r.title}</span>`;
      b.addEventListener('click', () => {
        close();
        r.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        r.el.classList.remove('rule-flash');
        void r.el.offsetWidth; // animatsiyani qayta ishga tushirish
        r.el.classList.add('rule-flash');
        setTimeout(() => r.el.classList.remove('rule-flash'), 3600);
      });
      list.appendChild(b);
    });

    function open() {
      panel.hidden = false;
      backdrop.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      panel.hidden = true;
      backdrop.hidden = true;
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', () => (panel.hidden ? open() : close()));
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  }

  /* ----------------------------------------------------------------------
     8. OʻYIN 1 — Pitsa ustasi
     ---------------------------------------------------------------------- */
  function initPizza() {
    const board = $('#pizzaBoard');
    if (!board) return;

    const target = $('#pizzaTarget'), count = $('#pizzaCount');
    const msg = $('#pizzaMsg');
    let den = 8, need = 3;
    const chosen = new Set();

    function newTask() {
      den = pick([4, 6, 8, 10]);
      need = rnd(1, den - 1);
      chosen.clear();
      target.textContent = need + '/' + den;
      msg.textContent = '';
      msg.className = 'game-msg';
      draw();
    }

    function draw() {
      const R = 100, C = 110, step = 360 / den;
      let s = `<svg viewBox="0 0 220 220" role="img" aria-label="Pitsa: ${den} ta boʻlak">`;
      s += `<circle cx="${C}" cy="${C}" r="${R + 4}" fill="#e8b56a" opacity=".55"/>`;
      for (let i = 0; i < den; i++) {
        const on = chosen.has(i);
        s += `<path data-slice="${i}" d="${slicePath(C, C, R, i * step, (i + 1) * step)}"
                fill="${on ? 'var(--viz-fill)' : 'var(--viz-empty)'}"
                stroke="var(--viz-stroke)" stroke-width="2.5"/>`;
      }
      board.innerHTML = s + '</svg>';
      count.textContent = chosen.size + '/' + den;
    }

    board.addEventListener('click', (e) => {
      const p = e.target.closest('[data-slice]');
      if (!p) return;
      const i = parseInt(p.dataset.slice, 10);
      if (chosen.has(i)) chosen.delete(i); else chosen.add(i);
      draw();
    });

    $('#pizzaCheck').addEventListener('click', () => {
      if (chosen.size === need) {
        msg.textContent = `🎉 Barakalla! ${need}/${den} — toʻppa-toʻgʻri!`;
        msg.className = 'game-msg good';
        burst($('#pizzaCheck'), true);
      } else {
        msg.textContent = `❌ Siz ${chosen.size} ta boʻlak tanladingiz, kerak ${need} ta. Yana urinib koʻring!`;
        msg.className = 'game-msg bad';
      }
    });

    $('#pizzaNew').addEventListener('click', newTask);
    newTask();
  }

  /* ----------------------------------------------------------------------
     9. OʻYIN 2 — Tezkor duel
     ---------------------------------------------------------------------- */
  function initDuel() {
    const btnA = $('#duelA'), btnB = $('#duelB');
    if (!btnA) return;

    const scoreEl = $('#duelScore'), timeEl = $('#duelTime');
    const msg = $('#duelMsg'), startBtn = $('#duelStart');
    let a, b, score = 0, time = 30, timer = null, running = false;

    function makePair() {
      let p, q;
      do {
        p = { n: rnd(1, 8), d: rnd(2, 10) };
        q = { n: rnd(1, 8), d: rnd(2, 10) };
      } while (p.n / p.d === q.n / q.d || p.n > p.d || q.n > q.d);
      a = p; b = q;
      btnA.textContent = a.n + '/' + a.d;
      btnB.textContent = b.n + '/' + b.d;
      btnA.className = 'duel-card';
      btnB.className = 'duel-card';
    }

    function answer(side) {
      if (!running) { msg.textContent = 'Avval “Boshlash” tugmasini bosing 🙂'; return; }
      const va = a.n / a.d, vb = b.n / b.d;
      const correct = va > vb ? 'a' : 'b';
      if (side === correct) {
        score++;
        msg.textContent = '✅ Toʻgʻri!';
        msg.className = 'game-msg good';
      } else {
        msg.textContent = `❌ Yoʻq. ${correct === 'a' ? a.n + '/' + a.d : b.n + '/' + b.d} kattaroq edi.`;
        msg.className = 'game-msg bad';
      }
      scoreEl.textContent = 'Ochko: ' + score;
      makePair();
    }

    btnA.addEventListener('click', () => answer('a'));
    btnB.addEventListener('click', () => answer('b'));

    startBtn.addEventListener('click', () => {
      clearInterval(timer);
      score = 0; time = 30; running = true;
      scoreEl.textContent = 'Ochko: 0';
      msg.textContent = 'Ketdik! Kattaroq kasrni bosing.';
      msg.className = 'game-msg';
      makePair();
      timer = setInterval(() => {
        time--;
        timeEl.textContent = '⏱ ' + time;
        if (time <= 0) {
          clearInterval(timer);
          running = false;
          msg.textContent = `⏰ Vaqt tugadi! Natijangiz: ${score} ochko. ${score >= 10 ? 'Zoʻr!' : 'Yana mashq qiling!'}`;
          msg.className = 'game-msg good';
        }
      }, 1000);
    });

    makePair();
  }

  /* ----------------------------------------------------------------------
     10. OʻYIN 3 — Teng kasrlar juftini top
     ---------------------------------------------------------------------- */
  function initMatch() {
    const board = $('#matchBoard');
    if (!board) return;
    const scoreEl = $('#matchScore'), msg = $('#matchMsg');

    const ALL = [
      ['1/2', '4/8'], ['1/3', '2/6'], ['3/4', '6/8'],
      ['2/5', '4/10'], ['1/4', '3/12'], ['2/3', '8/12'],
      ['5/6', '10/12'], ['1/5', '2/10'], ['3/5', '6/10']
    ];

    let picked = [], found = 0, lock = false;

    function start() {
      const pairs = shuffle(ALL).slice(0, 6);
      const cards = shuffle(pairs.flatMap((p, i) => [
        { text: p[0], pair: i }, { text: p[1], pair: i }
      ]));
      board.innerHTML = cards.map((c) =>
        `<button class="match-card" data-pair="${c.pair}">${c.text}</button>`).join('');
      picked = []; found = 0; lock = false;
      scoreEl.textContent = 'Topilgan juftlar: 0 / 6';
      msg.textContent = '';
      msg.className = 'game-msg';
    }

    board.addEventListener('click', (e) => {
      const card = e.target.closest('.match-card');
      if (!card || lock || card.classList.contains('done') || card.classList.contains('picked')) return;

      card.classList.add('picked');
      picked.push(card);

      if (picked.length === 2) {
        lock = true;
        const [c1, c2] = picked;
        if (c1.dataset.pair === c2.dataset.pair) {
          setTimeout(() => {
            c1.classList.add('done'); c2.classList.add('done');
            c1.classList.remove('picked'); c2.classList.remove('picked');
            found++;
            scoreEl.textContent = `Topilgan juftlar: ${found} / 6`;
            msg.textContent = `✅ ${c1.textContent} = ${c2.textContent} — teng kasrlar!`;
            msg.className = 'game-msg good';
            picked = []; lock = false;
            if (found === 6) {
              msg.textContent = '🏆 Ajoyib! Barcha juftlarni topdingiz!';
              burst(board, true);
            }
          }, 350);
        } else {
          msg.textContent = `❌ ${c1.textContent} va ${c2.textContent} teng emas.`;
          msg.className = 'game-msg bad';
          setTimeout(() => {
            c1.classList.remove('picked'); c2.classList.remove('picked');
            picked = []; lock = false;
          }, 750);
        }
      }
    });

    $('#matchNew').addEventListener('click', start);
    start();
  }

  /* ----------------------------------------------------------------------
     11. YAKUNIY TEST
     ---------------------------------------------------------------------- */
  const BANK = [
    { q: 'Tort 6 ta teng boʻlakka boʻlindi, 5 tasi yeyildi. Qaysi kasr yeyilganini bildiradi?', o: ['5/6', '6/5', '1/6', '5/1'], a: 0, e: 'Jami 6 boʻlak — maxraj 6, yeyilgani 5 — surat 5.' },
    { q: 'Kasrning pastki qismi qanday ataladi?', o: ['Surat', 'Maxraj', 'Butun', 'Qoldiq'], a: 1, e: 'Pastki son — maxraj, u butun nechaga boʻlinganini koʻrsatadi.' },
    { q: '“Toʻqqizdan toʻrt” qanday yoziladi?', o: ['9/4', '4/9', '4 : 9 = 0', '49'], a: 1, e: 'Avval maxraj (9) aytiladi, keyin surat (4) → 4/9.' },
    { q: 'Qaysi kasr eng katta?', o: ['1/9', '1/3', '1/5', '1/7'], a: 1, e: 'Suratlar teng boʻlsa, maxraji kichigi eng katta: 1/3.' },
    { q: '2/9 + 4/9 = ?', o: ['6/18', '6/9', '8/9', '2/9'], a: 1, e: 'Maxrajlar bir xil — faqat suratlar qoʻshiladi: 2+4=6 → 6/9.' },
    { q: '7/8 − 3/8 = ?', o: ['4/8', '4/0', '10/8', '4/16'], a: 0, e: 'Suratlarni ayiramiz: 7−3=4, maxraj oʻzgarmaydi → 4/8 (= 1/2).' },
    { q: '9/12 kasrini qisqartiring.', o: ['3/4', '1/3', '3/12', '9/4'], a: 0, e: 'EKUB = 3. 9:3=3, 12:3=4 → 3/4.' },
    { q: 'Qaysi biri notoʻgʻri kasr?', o: ['2/3', '5/9', '11/4', '1/8'], a: 2, e: 'Surati (11) maxrajidan (4) katta — bu notoʻgʻri kasr.' },
    { q: '13/5 ni aralash songa aylantiring.', o: ['2 3/5', '3 2/5', '1 8/5', '2 1/5'], a: 0, e: '13 : 5 = 2, qoldiq 3 → 2 3/5.' },
    { q: '3 1/4 ni notoʻgʻri kasrga aylantiring.', o: ['7/4', '13/4', '31/4', '12/4'], a: 1, e: '3·4 = 12, 12+1 = 13 → 13/4.' },
    { q: '30 ta shokoladning 1/6 qismi nechta?', o: ['6 ta', '5 ta', '10 ta', '3 ta'], a: 1, e: '30 : 6 = 5.' },
    { q: '48 ta oʻquvchining 3/4 qismi ekskursiyaga bordi. Nechta oʻquvchi bordi?', o: ['12', '24', '36', '16'], a: 2, e: '(48 : 4) · 3 = 12 · 3 = 36.' },
    { q: 'Qaysi kasr 1/2 ga teng?', o: ['3/5', '5/10', '2/5', '4/10'], a: 1, e: '5/10 ni 5 ga qisqartirsak 1/2 chiqadi.' },
    { q: '1/2 + 1/6 = ?', o: ['2/8', '4/6', '2/6', '1/3'], a: 1, e: 'Umumiy maxraj 6: 1/2 = 3/6. Keyin 3/6 + 1/6 = 4/6 (= 2/3).' },
    { q: 'Butun 10 ta teng boʻlakka boʻlindi. Barcha boʻlaklar birga qanday kasr beradi?', o: ['10/10, yaʼni 1', '1/10', '10/1', '0/10'], a: 0, e: 'Hamma boʻlak olinsa surat maxrajga teng boʻladi → 1.' },
    { q: '2 soatning 1/4 qismi necha daqiqa?', o: ['15 daqiqa', '30 daqiqa', '45 daqiqa', '20 daqiqa'], a: 1, e: '2 soat = 120 daqiqa. 120 : 4 = 30 daqiqa.' },
    { q: 'Qaysi qatorda kasrlar kamayish tartibida?', o: ['1/6, 1/4, 1/2', '1/2, 1/4, 1/6', '1/4, 1/6, 1/2', '1/4, 1/2, 1/6'], a: 1, e: 'Suratlar teng — maxraj oshgani sari kasr kichrayadi: 1/2 > 1/4 > 1/6.' },
    { q: '5/7 + 2/7 = ?', o: ['7/14', '7/7 = 1', '3/7', '10/7'], a: 1, e: '5+2 = 7 → 7/7, bu esa butun 1 ga teng.' },
    { q: 'Doira 4 ta boʻlakka boʻlindi, lekin boʻlaklar har xil kattalikda. Bitta boʻlakni 1/4 desa boʻladimi?', o: ['Ha, boʻladi', 'Yoʻq, boʻlaklar teng boʻlishi shart', 'Faqat kattasini', 'Bilib boʻlmaydi'], a: 1, e: 'Kasr faqat TENG boʻlaklar uchun ishlatiladi.' },
    { q: '20 soʻmning 2/5 qismi qancha?', o: ['4 soʻm', '8 soʻm', '10 soʻm', '12 soʻm'], a: 1, e: '(20 : 5) · 2 = 4 · 2 = 8 soʻm.' },
    { q: 'Qaysi kasr 1 dan katta?', o: ['4/5', '9/9', '7/6', '3/8'], a: 2, e: 'Surati maxrajidan katta boʻlsa, kasr 1 dan katta: 7/6.' },
    { q: '6/8 kasrining eng sodda koʻrinishi qaysi?', o: ['3/4', '2/4', '12/16', '1/2'], a: 0, e: 'EKUB = 2 → 6:2=3, 8:2=4 → 3/4.' }
  ];

  function initExam() {
    const wrap = $('#exam');
    if (!wrap) return;

    const startBox = $('#examStart'), runBox = $('#examRun'), resBox = $('#examResult');
    const qEl = $('#examQ'), optsEl = $('#examOpts'), expEl = $('#examExp');
    const counter = $('#examCounter'), scoreEl = $('#examScore'), progEl = $('#examProgress');
    const nextBtn = $('#examNext');

    let set = [], idx = 0, score = 0, log = [];

    function start() {
      set = shuffle(BANK).slice(0, 10);
      idx = 0; score = 0; log = [];
      startBox.hidden = true;
      resBox.hidden = true;
      runBox.hidden = false;
      render();
    }

    function render() {
      const q = set[idx];
      counter.textContent = idx + 1 + ' / ' + set.length;
      scoreEl.textContent = 'Ball: ' + score;
      progEl.style.width = (idx / set.length) * 100 + '%';
      qEl.textContent = q.q;
      expEl.className = 'exam-exp';
      expEl.innerHTML = '';
      nextBtn.hidden = true;

      const order = shuffle(q.o.map((t, i) => ({ t, i })));
      optsEl.innerHTML = '';
      order.forEach((o) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.textContent = o.t;
        b.addEventListener('click', () => choose(o.i, b));
        optsEl.appendChild(b);
      });
    }

    function choose(chosenIdx, btn) {
      const q = set[idx];
      const right = chosenIdx === q.a;
      if (right) { score++; burst(btn); }

      log.push({ q: q.q, ok: right, right: q.o[q.a], e: q.e });

      $$('.opt', optsEl).forEach((b) => {
        b.disabled = true;
        if (b.textContent === q.o[q.a]) b.classList.add('is-right');
      });
      if (!right) btn.classList.add('is-wrong');

      expEl.innerHTML = `<b>${right ? '✅ Toʻgʻri!' : '❌ Toʻgʻri javob: ' + q.o[q.a]}</b><br>${q.e}`;
      expEl.className = 'exam-exp show';
      scoreEl.textContent = 'Ball: ' + score;
      nextBtn.hidden = false;
      nextBtn.textContent = idx === set.length - 1 ? 'Natijani koʻrish 🏁' : 'Keyingisi →';
    }

    nextBtn.addEventListener('click', () => {
      idx++;
      if (idx >= set.length) finish();
      else render();
    });

    function finish() {
      runBox.hidden = true;
      resBox.hidden = false;

      const grade = score >= 9 ? 5 : score >= 7 ? 4 : score >= 5 ? 3 : 2;
      const medals = { 5: '🏆', 4: '🥈', 3: '🥉', 2: '📚' };
      const texts = {
        5: 'Aʼlo natija! Siz kasrlar mavzusini toʻliq oʻzlashtirgansiz.',
        4: 'Yaxshi! Bir-ikkita kichik xato bor — ularni koʻrib chiqing.',
        3: 'Qoniqarli. Mavzuni yana bir bor takrorlash foydali boʻladi.',
        2: 'Xafa boʻlmang! Boʻlimlarni qaytadan oʻqib, testni yana ishlang.'
      };

      $('#resMedal').textContent = medals[grade];
      $('#resTitle').textContent = grade === 5 ? 'Zoʻr ish!' : grade === 4 ? 'Yaxshi natija' : 'Davom eting!';
      $('#resScore').textContent = `${score} / ${set.length} ball · baho: ${grade}`;
      $('#resText').textContent = texts[grade];

      const wrong = log.filter((l) => !l.ok);
      $('#resReview').innerHTML = wrong.length
        ? '<div class="ak-sec">Xatolar tahlili</div>' + wrong.map((l) =>
            `<div class="rv"><b>${l.q}</b><br>✅ Toʻgʻri javob: ${l.right}<br><span style="opacity:.8">${l.e}</span></div>`).join('')
        : '<div class="rv ok">🎉 Bitta ham xato yoʻq — barcha savollar toʻgʻri!</div>';

      if (grade >= 4) burst($('#resMedal'), true);
    }

    $('#examStartBtn').addEventListener('click', start);
    $('#examAgain').addEventListener('click', start);
  }

  /* ----------------------------------------------------------------------
     12. SALYUT — toʻgʻri javob uchun nishonlash effekti
     ---------------------------------------------------------------------- */
  const FW = {
    canvas: null,
    ctx: null,
    sparks: [],
    raf: null,
    colors: ['#2f6fed', '#16a37b', '#f5a524', '#f2597c', '#7b61ff', '#ff8f3c', '#22c3e6']
  };

  function fwSetup() {
    if (FW.canvas) return;
    const c = document.createElement('canvas');
    c.id = 'fwCanvas';
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    FW.canvas = c;
    FW.ctx = c.getContext('2d');
    fwResize();
    window.addEventListener('resize', fwResize);
  }

  function fwResize() {
    if (!FW.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    FW.canvas.width = window.innerWidth * dpr;
    FW.canvas.height = window.innerHeight * dpr;
    FW.canvas.style.width = window.innerWidth + 'px';
    FW.canvas.style.height = window.innerHeight + 'px';
    FW.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Ekran oʻlchamiga qarab salyut kattaligi */
  function fwScale() {
    const s = Math.min(window.innerWidth, window.innerHeight * 1.6) / 900;
    return Math.max(0.85, Math.min(1.9, s));
  }

  /** Portlash — uchqunlar berilgan nuqtadan tarqaladi */
  function fwExplode(x, y, color) {
    const sf = fwScale();
    const count = 80 + Math.floor(Math.random() * 45);
    const power = (7.5 + Math.random() * 4.5) * sf;
    const twoTone = Math.random() < 0.5 ? pick(FW.colors) : null;

    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.1;
      const s = power * (0.55 + Math.random() * 0.7);
      FW.sparks.push({
        x: x, y: y, px: x, py: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        decay: 0.0065 + Math.random() * 0.007,
        w: (2.6 + Math.random() * 3) * sf,
        color: twoTone && i % 2 ? twoTone : color
      });
    }
    // markazdagi yorugʻlik chaqnashi
    FW.sparks.push({ flash: true, x: x, y: y, r: 10 * sf, grow: 130 * sf, life: 1, decay: 0.045, color: color });

    if (!FW.raf) FW.raf = requestAnimationFrame(fwLoop);
  }

  function fwLoop() {
    const ctx = FW.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineCap = 'round';

    // uchqunlar
    for (let i = FW.sparks.length - 1; i >= 0; i--) {
      const p = FW.sparks[i];
      p.life -= p.decay;
      if (p.life <= 0) { FW.sparks.splice(i, 1); continue; }

      if (p.flash) {
        ctx.globalAlpha = p.life * 0.55;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + (1 - p.life) * p.grow, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      p.px = p.x; p.py = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.986;
      p.vy = p.vy * 0.986 + 0.075; // ogʻirlik kuchi

      const a = Math.max(0, p.life);
      ctx.strokeStyle = p.color;

      // atrofidagi yogʻdu
      ctx.globalAlpha = a * 0.3;
      ctx.lineWidth = p.w * 2.6 * a;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // uchqunning oʻzi
      ctx.globalAlpha = a;
      ctx.lineWidth = p.w * a;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    if (FW.sparks.length) {
      FW.raf = requestAnimationFrame(fwLoop);
    } else {
      cancelAnimationFrame(FW.raf);
      FW.raf = null;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Toʻgʻri javob nishonlanadi — salyut aynan shu elementning ustidan portlaydi.
   * @param {Element} el - toʻgʻri bosilgan tugma (portlash markazi)
   * @param {boolean} big - katta salyut (test yakuni, oʻyin gʻalabasi)
   */
  function burst(el, big) {
    if (el) {
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 450);
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    fwSetup();

    // portlash markazi — bosilgan elementning oʻrtasi
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    if (el) {
      const r = el.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    }

    // asosiy portlash — aynan javob ustida
    fwExplode(cx, cy, pick(FW.colors));

    // qoʻshimcha portlashlar shu nuqta atrofida
    const extra = big ? 6 : 2;
    const spread = big ? 230 : 120;
    for (let i = 1; i <= extra; i++) {
      setTimeout(() => {
        const x = Math.max(60, Math.min(window.innerWidth - 60, cx + (Math.random() - 0.5) * spread * 2));
        const y = Math.max(60, Math.min(window.innerHeight - 60, cy + (Math.random() - 0.5) * spread * 1.4));
        fwExplode(x, y, pick(FW.colors));
      }, i * (big ? 170 : 210));
    }
  }

  /* ----------------------------------------------------------------------
     13. INTERFEYS: mavzu, oʻqituvchi rejimi, navigatsiya, progress
     ---------------------------------------------------------------------- */
  function initUI() {
    // --- Kunduzgi / tungi rejim ---
    const themeBtn = $('#themeBtn');

    // Fleshka/file:// rejimida ayrim brauzerlar localStorage ni bloklaydi —
    // xato butun interfeysni toʻxtatib qoʻymasligi uchun oʻrab olamiz.
    const store = {
      get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* eʼtiborsiz */ } },
    };

    const saved = store.get('kasr-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    const syncThemeIcon = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (themeBtn) themeBtn.textContent = dark ? '☀️' : '🌙';
    };
    syncThemeIcon();
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (dark) document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', 'dark');
        store.set('kasr-theme', dark ? 'light' : 'dark');
        syncThemeIcon();
      });
    }

    // --- Oʻqituvchi rejimi ---
    const tBtn = $('#teacherBtn');
    if (tBtn) {
      tBtn.addEventListener('click', () => {
        const on = document.body.classList.toggle('teacher');
        tBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        // yopiq yechimlarni ham ochamiz/yopamiz
        $$('details.task').forEach((d) => { d.open = on; });
        const ak = $('#answerKey'), akBtn = $('#akToggle');
        if (ak && akBtn) {
          if (on) ak.removeAttribute('hidden'); else ak.setAttribute('hidden', '');
          akBtn.textContent = on ? 'Javoblarni yashirish' : 'Javoblarni koʻrsatish';
        }
      });
    }

    // --- Chop etish (barcha javoblar ochiq holda chiqsin) ---
    const openAllForPrint = () => {
      $$('details.task').forEach((d) => { d.open = true; });
      const ak = $('#answerKey');
      if (ak) ak.removeAttribute('hidden');
    };
    [$('#printBtn'), $('#printBtn2')].forEach((b) => b && b.addEventListener('click', () => {
      openAllForPrint();
      window.print();
    }));
    window.addEventListener('beforeprint', openAllForPrint);

    // --- Mobil menyu ---
    const nav = $('#nav'), navToggle = $('#navToggle');
    if (nav && navToggle) {
      navToggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', nav).forEach((a) => a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }));
    }

    // --- Yuqoriga tugmasi + progress + aktiv boʻlim ---
    const fill = $('#progressFill'), toTop = $('#toTop');
    const sections = $$('main section[id]');
    const links = $$('#nav a');

    if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    let ticking = false;
    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const y = h.scrollTop || document.body.scrollTop;
      if (fill) fill.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      if (toTop) toTop.hidden = y < 500;

      let current = '';
      sections.forEach((s) => {
        if (s.offsetTop - 140 <= y) current = s.id;
      });
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------------
     ISHGA TUSHIRISH
     ---------------------------------------------------------------------- */
  function boot() {
    renderAllViz(document);
    initLab1();
    initNumberLine();
    initCompare();
    initReducer();
    initCalc();
    initQuizzes();
    initRules();
    initPizza();
    initDuel();
    initMatch();
    initExam();
    initUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
