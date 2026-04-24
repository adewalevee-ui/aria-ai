// =============================================
//  ARIA AI — Main JavaScript
// =============================================

const IS_LANDING = document.getElementById('bg-canvas') !== null;
const IS_CHAT    = document.getElementById('messagesArea') !== null;

// =============================================
//  THREE.JS PARTICLE BACKGROUND (Landing only)
// =============================================
if (IS_LANDING) {
  initThreeBackground();
  initCounters();
}

function initThreeBackground() {
  const canvas   = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;

  // Particles
  const count    = 1800;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);

  const neonColors = [
    new THREE.Color(0x00c8ff),
    new THREE.Color(0x7b2fff),
    new THREE.Color(0xff2fc8),
    new THREE.Color(0x00ff88),
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    const c = neonColors[Math.floor(Math.random() * neonColors.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    particles.rotation.y += 0.0008;
    particles.rotation.x += 0.0003;
    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    renderer.render(scene, camera);
  }
  animate();
}

// =============================================
//  COUNTER ANIMATION (Landing About section)
// =============================================
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.stat-num').forEach(el => {
          const target = parseInt(el.dataset.target);
          animateCounter(el, target);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const statsEl = document.querySelector('.holo-stats');
  if (statsEl) observer.observe(statsEl);
}

function animateCounter(el, target) {
  let current = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current);
  }, 25);
}

// =============================================
//  CHAT PAGE LOGIC
// =============================================
if (IS_CHAT) {
  initChat();
}

function initChat() {
  const messagesArea  = document.getElementById('messagesArea');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const userInput     = document.getElementById('userInput');
  const sendBtn       = document.getElementById('sendBtn');
  const newChatBtn    = document.getElementById('newChatBtn');
  const clearBtn      = document.getElementById('clearBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar       = document.querySelector('.sidebar');
  const welcomeTyping = document.getElementById('welcomeTyping');

  let chatStarted = false;
  let isTyping    = false;

  // ---- Welcome Typing Phrases ----
  const phrases = [
    "How can I help you today?",
    "Let's get started — ask me anything.",
    "Welcome back! What's on your mind?",
    "What's up today? I'm all yours.",
    "Ready when you are. Fire away.",
    "Tell me what you need and I'll handle it.",
    "Hey there! What can I do for you?",
  ];
  let phraseIdx = 0;
  let charIdx   = 0;
  let deleting  = false;
  let typingTimeout;

  function typeWelcome() {
    if (!welcomeTyping) return;
    const phrase = phrases[phraseIdx];

    if (!deleting) {
      welcomeTyping.textContent = phrase.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === phrase.length) {
        deleting = true;
        typingTimeout = setTimeout(typeWelcome, 2200);
        return;
      }
    } else {
      welcomeTyping.textContent = phrase.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting  = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    }
    typingTimeout = setTimeout(typeWelcome, deleting ? 40 : 75);
  }

  typeWelcome();

  // ---- Suggestion Cards ----
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const msg = card.dataset.msg;
      userInput.value = msg;
      handleSend();
    });
  });

  // ---- Textarea Auto-resize ----
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
    sendBtn.disabled = userInput.value.trim() === '';
  });

  // ---- Enter to Send ----
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && !isTyping) handleSend();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled && !isTyping) handleSend();
  });

  // ---- New Chat / Clear ----
  newChatBtn.addEventListener('click', resetChat);
  clearBtn.addEventListener('click', resetChat);

  function resetChat() {
    // Remove all messages
    const messages = messagesArea.querySelectorAll('.message');
    messages.forEach(m => m.remove());
    chatStarted = false;
    welcomeScreen.style.display = 'flex';
    clearTimeout(typingTimeout);
    typeWelcome();
  }

  // ---- Sidebar Toggle ----
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // ---- Main Send Handler ----
  async function handleSend() {
    const message = userInput.value.trim();
    if (!message || isTyping) return;

    // Hide welcome
    if (!chatStarted) {
      welcomeScreen.style.display = 'none';
      chatStarted = true;
      clearTimeout(typingTimeout);
    }

    // Add user message
    appendMessage('user', message);

    // Reset input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Show typing indicator
    const typingEl = showTyping();
    isTyping = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      typingEl.remove();
      isTyping = false;

      if (data.reply) {
        appendMessage('ai', data.reply);
      } else if (data.error) {
        appendMessage('ai', `⚠️ Error: ${data.error}`);
      }
    } catch (err) {
      typingEl.remove();
      isTyping = false;
      appendMessage('ai', '⚠️ Could not connect to Aria. Check your connection and try again.');
    }

    scrollToBottom();
  }

  // ---- Append Message ----
  function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${role}`;

    if (role === 'ai') {
      wrapper.innerHTML = `
        <div class="message-avatar ai-avatar">
          <i class="fa-solid fa-microchip"></i>
        </div>
        <div class="message-content">
          <div class="message-bubble ai-bubble">${formatAIText(text)}</div>
        </div>
      `;
    } else {
      wrapper.innerHTML = `
        <div class="message-content">
          <div class="message-bubble user-bubble">${escapeHTML(text)}</div>
        </div>
        <div class="message-avatar user-avatar">
          <i class="fa-solid fa-user"></i>
        </div>
      `;
    }

    messagesArea.appendChild(wrapper);

    // Highlight code
    wrapper.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });

    scrollToBottom();
  }

  // ---- Typing Indicator ----
  function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message ai';
    wrapper.innerHTML = `
      <div class="message-avatar ai-avatar">
        <i class="fa-solid fa-microchip"></i>
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    messagesArea.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  // ---- Format AI Response ----
  function formatAIText(text) {
    // Code blocks
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang || 'plaintext'}">${escapeHTML(code.trim())}</code></pre>`;
    });
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Line breaks
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br/>');
    return `<p>${text}</p>`;
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
}
