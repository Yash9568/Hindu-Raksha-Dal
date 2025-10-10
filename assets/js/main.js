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

  async function printCard(){
    try {
      if (!c.area) return alert('Card area not found');
      await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
      const overlay = c.area.querySelector('.bg-gradient-to-r');
      const prevDisplay = overlay ? overlay.style.display : '';
      if (overlay) overlay.style.display = 'none';
      const canvas = await html2canvas(c.area, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        width: c.area.offsetWidth || 340,
        height: c.area.offsetHeight || 210,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc) => {
          const style = doc.createElement('style');
          style.textContent = `html, body, *, *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; }
          #cardArea, #cardArea * { color: #111827 !important; }`;
          doc.head.appendChild(style);
          const ov = doc.querySelector('#cardArea .bg-gradient-to-r');
          if (ov) ov.style.display = 'none';
        }
      });
      if (overlay) overlay.style.display = prevDisplay;
      const dataUrl = canvas.toDataURL('image/png');
      const w = window.open('', 'printWindow');
      if (!w) { alert('Popup blocked. Allow popups to print.'); return; }
      const html = `<!DOCTYPE html><html><head><title>Print Card</title>
        <style>
          html,body{margin:0;padding:0}
          @page{size: auto;margin: 10mm}
          .wrap{display:flex;align-items:center;justify-content:center;width:100vw;height:100vh}
          img{max-width:100%;height:auto}
        </style>
      </head><body>
        <div class="wrap"><img src="${dataUrl}" alt="Membership Card"/></div>
        <script>window.addEventListener('load',()=>{setTimeout(()=>{window.print();}, 50)});</script>
      </body></html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e){
      console.error('Print failed', e);
      alert('Print nahi ho paya. Kripya PDF/PNG export try karein.');
    }
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
    id: $('#cardId'), name: $('#cardName'), email: $('#cardEmail'), phone: $('#cardPhone'), address: $('#cardAddress'), dob: $('#cardDob'), issued: $('#cardIssued'), valid: $('#cardValid'), photo: $('#cardPhoto'), area: $('#cardArea')
  };

  function zeroPad(n, len=5){ return String(n).padStart(len,'0'); }
  function generateMemberIdLocal(){
    const year = new Date().getFullYear();
    const seq = Date.now() % 100000;
    return `HRD-${year}-${zeroPad(seq)}`;
  }

  async function generateMemberIdSmart(){
    // Try backend if available, with a short timeout
    const controller = new AbortController();
    const t = setTimeout(()=>controller.abort(), 3000);
    try {
      const res = await fetch('/api/membership/generate', { method: 'POST', cache: 'no-store', signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json().catch(()=>({}));
        if (data && data.memberId) return data.memberId;
      }
    } catch(_) { /* ignore and fallback */ }
    // Fallback to local
    return generateMemberIdLocal();
  }

  function computeValidity(issuedDate){
    try {
      const d = issuedDate ? new Date(issuedDate) : new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toLocaleDateString();
    } catch { return '—'; }
  }

  function updateCardFromForm(){
    c.name.textContent = m.name.value || '—';
    c.email.textContent = m.email.value || '—';
    c.phone.textContent = m.phone.value || '—';
    c.address.textContent = m.address.value || '—';
    c.dob.textContent = m.dob.value || '—';
    const issued = new Date().toLocaleDateString();
    c.issued.textContent = issued;
    if (c.valid) c.valid.textContent = computeValidity(issued);
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

  let lastGenAt = 0, lastGenId = '';
  const btnGen = $('#btnGenerateId');
  btnGen.addEventListener('click', async ()=>{
    const now = Date.now();
    if (now - lastGenAt < 800 && lastGenId) { // prevent rapid duplicates
      c.id.textContent = lastGenId;
      updateCardFromForm();
      return;
    }
    btnGen.disabled = true;
    btnGen.textContent = 'Generating…';
    try {
      const id = await generateMemberIdSmart();
      lastGenAt = Date.now();
      lastGenId = id;
      c.id.textContent = id;
      updateCardFromForm();
    } finally {
      btnGen.disabled = false;
      btnGen.textContent = 'Generate Member ID';
    }
  });

  // Initialize preview on load so card is never empty
  updateCardFromForm();

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
        foreignObjectRendering: true,
        width: c.area.offsetWidth || 340,
        height: c.area.offsetHeight || 210,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc) => {
          // Global style override to avoid complex backgrounds/shadows
          const style = doc.createElement('style');
          style.textContent = `html, body, *, *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; }
          #cardArea, #cardArea * { color: #111827 !important; }`;
          doc.head.appendChild(style);
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
      // Temporarily hide gradient overlays that html2canvas may skip
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
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) { alert('jsPDF not loaded'); return; }
      const pdfW = canvas.width;
      const pdfH = canvas.height;
      const pdf = new jsPDF({ orientation: (pdfW >= pdfH ? 'landscape' : 'portrait'), unit: 'px', format: [pdfW, pdfH] });
      // Fill explicit white background then draw image to avoid transparency issues
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfW, pdfH, 'F');
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save((c.id.textContent || 'HRD-card') + '.pdf');
    } catch (e){
      console.error('PDF export failed (attempt 1)', e);
      // Retry without photo to avoid CORS-tainted canvas issues
      try {
        const prevDisp = c.photo ? c.photo.style.display : '';
        if (c.photo) c.photo.style.display = 'none';
        await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
        const canvas = await html2canvas(c.area, {
          scale: 3,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true,
          width: c.area.offsetWidth || 340,
          height: c.area.offsetHeight || 210,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc) => {
            const style = doc.createElement('style');
            style.textContent = `html, body, *, *::before, *::after { background: transparent !important; background-image: none !important; box-shadow: none !important; }
            #cardArea, #cardArea * { color: #111827 !important; }`;
            doc.head.appendChild(style);
            const ov = doc.querySelector('#cardArea .bg-gradient-to-r');
            if (ov) ov.style.display = 'none';
          }
        });
        if (c.photo) c.photo.style.display = prevDisp;
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { alert('jsPDF not loaded'); return; }
        const pdfW = canvas.width;
        const pdfH = canvas.height;
        const pdf = new jsPDF({ orientation: (pdfW >= pdfH ? 'landscape' : 'portrait'), unit: 'px', format: [pdfW, pdfH] });
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfW, pdfH, 'F');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        pdf.save((c.id.textContent || 'HRD-card') + '.pdf');
      } catch (e2) {
        console.error('PDF export failed (attempt 2, no photo)', e2);
        // Final fallback: try canvas renderer without foreignObjectRendering
        try {
          await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
          const canvas = await html2canvas(c.area, {
            scale: 3,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            width: c.area.offsetWidth || 340,
            height: c.area.offsetHeight || 210,
            scrollX: 0,
            scrollY: 0
          });
          const imgData = canvas.toDataURL('image/png');
          const { jsPDF } = window.jspdf || {};
          if (!jsPDF) { alert('jsPDF not loaded'); return; }
          const pdfW = canvas.width;
          const pdfH = canvas.height;
          const pdf = new jsPDF({ orientation: (pdfW >= pdfH ? 'landscape' : 'portrait'), unit: 'px', format: [pdfW, pdfH] });
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfW, pdfH, 'F');
          pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
          pdf.save((c.id.textContent || 'HRD-card') + '.pdf');
        } catch (e3) {
          console.error('PDF export failed (attempt 3, canvas renderer)', e3);
          alert('Preview PDF me print nahi ho raha. Kripya page ko reload karke photo ke bina phir se koshish karein.');
        }
      }
    }
  }

  $('#btnDownloadPNG').addEventListener('click', downloadPNG);
  $('#btnDownloadPDF').addEventListener('click', downloadPDF);
  $('#btnPrintCard').addEventListener('click', printCard);

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
