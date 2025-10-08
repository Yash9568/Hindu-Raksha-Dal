/* Main JS for static prototype */
(function(){
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Footer year
  $('#year').textContent = new Date().getFullYear();

  // Demo latest posts
  const demoPosts = [
    {title:'Significance of Diwali', img:'https://images.unsplash.com/photo-1543709539-5e96ff5f2c4b?q=80&w=1200&auto=format&fit=crop'},
    {title:'Gita Teachings', img:'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop'},
    {title:'Temple Architecture', img:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop'}
  ];
  const latestWrap = $('#latestPosts');
  if (latestWrap) {
    latestWrap.innerHTML = demoPosts.map(p => `
      <article class="border rounded overflow-hidden bg-white">
        <img src="${p.img}" alt="${p.title}" class="w-full h-40 object-cover"/>
        <div class="p-3">
          <h4 class="font-semibold">${p.title}</h4>
          <p class="text-sm text-gray-600">Read more…</p>
        </div>
      </article>`).join('');
  }

  // Modals
  $('#btnOpenLogin')?.addEventListener('click', () => $('#loginModal').classList.remove('hidden'));
  $('#btnOpenRegister')?.addEventListener('click', () => $('#registerModal').classList.remove('hidden'));
  $$('.modal-close').forEach(btn => btn.addEventListener('click', (e)=>{
    const id = e.currentTarget.getAttribute('data-target');
    document.getElementById(id).classList.add('hidden');
  }));

  // Post form preview
  const postForm = $('#postForm');
  const postPreview = $('#postPreview');
  const postImage = $('#postImage');
  const postVideo = $('#postVideo');
  function renderPostPreview(){
    const type = $('#postType').value;
    const title = $('#postTitle').value.trim();
    const content = $('#postContent').value.trim();
    const cats = $('#postCategories').value;
    const tags = $('#postTags').value;
    let html = `<div class="text-base font-semibold mb-1">${title || 'Untitled'}</div>`;
    if (type === 'text') html += `<p class="mb-2">${content || '—'}</p>`;
    if (postImage.files[0]) html += `<img class="w-full rounded mb-2" src="${URL.createObjectURL(postImage.files[0])}"/>`;
    if (postVideo.files[0]) html += `<video class="w-full rounded mb-2" src="${URL.createObjectURL(postVideo.files[0])}" controls></video>`;
    html += `<div class="text-xs text-gray-500">Categories: ${cats || '—'} | Tags: ${tags || '—'}</div>`;
    postPreview.innerHTML = html;
  }
  ['change','input'].forEach(ev => {
    ['#postType','#postTitle','#postContent','#postCategories','#postTags'].forEach(sel => $(sel).addEventListener(ev, renderPostPreview));
  });

  postImage.addEventListener('change', renderPostPreview);
  postVideo.addEventListener('change', renderPostPreview);
  postForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    alert('This is a demo. In the full app, your post will be submitted for approval.');
  });

  // Membership Card
  const m = {
    name: $('#mName'), email: $('#mEmail'), phone: $('#mPhone'), address: $('#mAddress'), dob: $('#mDob'), photo: $('#mPhoto')
  };
  const c = {
    id: $('#cardId'), name: $('#cardName'), email: $('#cardEmail'), phone: $('#cardPhone'), address: $('#cardAddress'), dob: $('#cardDob'), issued: $('#cardIssued'), photo: $('#cardPhoto'), area: $('#cardArea')
  };

  function zeroPad(n, len=5){ return String(n).padStart(len,'0'); }
  function generateMemberId(){
    const year = new Date().getFullYear();
    // Simple demo sequence using time; backend will guarantee uniqueness later
    const seq = Date.now() % 100000; 
    return `HRD-${year}-${zeroPad(seq)}`;
  }

  function updateCardFromForm(){
    c.name.textContent = m.name.value || '—';
    c.email.textContent = m.email.value || '—';
    c.phone.textContent = m.phone.value || '—';
    c.address.textContent = m.address.value || '—';
    c.dob.textContent = m.dob.value || '—';
    c.issued.textContent = new Date().toLocaleDateString();
  }

  m.name.addEventListener('input', updateCardFromForm);
  m.email.addEventListener('input', updateCardFromForm);
  m.phone.addEventListener('input', updateCardFromForm);
  m.address.addEventListener('input', updateCardFromForm);
  m.dob.addEventListener('change', updateCardFromForm);
  m.photo.addEventListener('change', () => {
    const file = m.photo.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    c.photo.src = url;
  });

  $('#btnGenerateId').addEventListener('click', ()=>{
    const id = generateMemberId();
    c.id.textContent = id;
    updateCardFromForm();
  });

  async function downloadPNG(){
    try {
      if (!c.area) return alert('Card area not found');
      // wait 2 frames for layout/preview images
      await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
      const overlay = c.area.querySelector('.bg-gradient-to-r');
      const prevDisplay = overlay ? overlay.style.display : '';
      if (overlay) overlay.style.display = 'none';
      const canvas = await html2canvas(c.area, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        onclone: (doc) => {
          const ov = doc.querySelector('#cardArea .bg-gradient-to-r');
          if (ov) ov.style.display = 'none';
        }
      });
      if (overlay) overlay.style.display = prevDisplay;
      const link = document.createElement('a');
      link.download = (c.id.textContent || 'HRD-card') + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e){
      console.error('PNG export failed', e);
      alert('Could not generate PNG. Try another image or remove external images from the card.');
    }
  }

  async function downloadPDF(){
    try {
      if (!c.area) return alert('Card area not found');
      await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
      const canvas = await html2canvas(c.area, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) { alert('jsPDF not loaded'); return; }
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [340, 210] });
      pdf.addImage(imgData, 'PNG', 0, 0, 340, 210);
      pdf.save((c.id.textContent || 'HRD-card') + '.pdf');
    } catch (e){
      console.error('PDF export failed', e);
      alert('Could not generate PDF. Try another image or remove external images from the card.');
    }
  }

  $('#btnDownloadPNG').addEventListener('click', downloadPNG);
  $('#btnDownloadPDF').addEventListener('click', downloadPDF);

  // Search demo
  const btnSearch = $('#btnSearch');
  btnSearch.addEventListener('click', ()=>{
    const q = $('#q').value.toLowerCase();
    const cat = $('#cat').value.toLowerCase();
    const tag = $('#tag').value.toLowerCase();
    const resultsWrap = $('#searchResults');
    const filtered = demoPosts.filter(p => p.title.toLowerCase().includes(q));
    resultsWrap.innerHTML = filtered.map(p => `
      <article class="border rounded overflow-hidden bg-white">
        <img src="${p.img}" alt="${p.title}" class="w-full h-40 object-cover"/>
        <div class="p-3">
          <h4 class="font-semibold">${p.title}</h4>
          <p class="text-sm text-gray-600">Category: ${cat || 'General'} | Tag: ${tag || 'Info'}</p>
        </div>
      </article>`).join('') || '<p class="text-sm text-gray-600">No results found.</p>';
  });
})();
