var hamburgerBtn = document.getElementById('hamburgerBtn');
var mobileMenu = document.getElementById('mobileMenu');
var mobileBackdrop = document.getElementById('mobileMenuBackdrop');
var mobileMenuOpen = false;

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  hamburgerBtn.classList.toggle('open', mobileMenuOpen);
  mobileMenu.classList.toggle('open', mobileMenuOpen);
  mobileBackdrop.classList.toggle('open', mobileMenuOpen);
  document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
}

function closeMobileMenu() {
  if (!mobileMenuOpen) return;
  mobileMenuOpen = false;
  hamburgerBtn.classList.remove('open');
  mobileMenu.classList.remove('open');
  mobileBackdrop.classList.remove('open');
  document.body.style.overflow = '';
}

hamburgerBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  toggleMobileMenu();
});

mobileBackdrop.addEventListener('click', function() {
  closeMobileMenu();
});

function mobileNavTo(target) {
  closeMobileMenu();
  setTimeout(function() {
    if (target === 'hero') {
      backToHero();
    } else {
      showSection(target);
    }
  }, mobileMenuOpen ? 350 : 0);
}

function updateMobileMenuCurrent(sectionId) {
  var links = document.querySelectorAll('.mobile-menu-link[data-section]');
  links.forEach(function(link) {
    var isCurrent = link.getAttribute('data-section') === sectionId;
    link.classList.toggle('current', isCurrent);
  });
}

var API_URL = 'https://script.google.com/macros/s/AKfycbxhWlVVju5j_n3NGcdaXNKSLTQEa_iDBAHuisFXWTdwjrjBAUN66V2cMUWeskF9FIyB/exec';

var GALLERY_FALLBACK = {};
var galleryData = JSON.parse(JSON.stringify(GALLERY_FALLBACK));
var SCHEDULE_DATA_FALLBACK = [];
var SCHEDULE_DATA = SCHEDULE_DATA_FALLBACK.slice();

var HASHTAG_DATA = [];
var HASHTAG_FALLBACK = [];
var HASHTAG_DISPLAY_LIMIT = 10;

function groupScheduleData(flatData) {
  var groups = {};
  flatData.forEach(function(row) {
    if (!groups[row.nama]) {
      groups[row.nama] = {
        name: row.nama,
        type: row.tipe,
        desc: row.deskripsi,
        schedule: []
      };
    }
    groups[row.nama].schedule.push({
      date: row.tanggal,
      time: row.jam,
      id: row.id
    });
  });
  return Object.values(groups);
}

function loadGallery() {
  var url = API_URL + '?action=readGallery&t=' + Date.now();
  return fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.length > 0) {
        var grouped = {};
        data.forEach(function(row) {
          if (!grouped[row.folder]) {
            grouped[row.folder] = {
              tabKeys: [],
              tabLabels: {},
              images: {}
            };
          }
          var folder = grouped[row.folder];
          if (folder.tabKeys.indexOf(row.album) === -1) {
            folder.tabKeys.push(row.album);
            folder.tabLabels[row.album] = row.label;
            folder.images[row.album] = [];
          }
          folder.images[row.album].push({
            src: row.src,
            alt: row.alt
          });
        });

        ['lana', 'lanautica'].forEach(function(folder) {
          if (!grouped[folder] && GALLERY_FALLBACK[folder]) {
            grouped[folder] = JSON.parse(JSON.stringify(GALLERY_FALLBACK[folder]));
          }
        });
        galleryData = grouped;
      }
    })
    .catch(function() {
      galleryData = JSON.parse(JSON.stringify(GALLERY_FALLBACK));
    });
}

function loadSchedules() {
  var url = API_URL + '?action=read&t=' + Date.now();
  return fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var grouped = groupScheduleData(data);
      if (grouped.length > 0) {
        SCHEDULE_DATA = grouped;
      }
    })
    .catch(function() {
      SCHEDULE_DATA = SCHEDULE_DATA_FALLBACK.slice();
    });
}

function loadHashtags() {
  var url = API_URL + '?action=readHashtags&t=' + Date.now();
  return fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (Array.isArray(data) && data.length > 0) {
        HASHTAG_DATA = data.map(function(row) {
          return {
            desc: row.desc || row.keterangan || '',
            tag: row.tag || row.hashtag || ''
          };
        }).filter(function(h) {
          return h.tag.length > 0;
        });
      } else {
        HASHTAG_DATA = HASHTAG_FALLBACK.slice();
      }
    })
    .catch(function() {
      HASHTAG_DATA = HASHTAG_FALLBACK.slice();
    });
}

var BULAN = {
  'januari': 0, 'februari': 1, 'maret': 2,
  'april': 3, 'mei': 4, 'juni': 5,
  'juli': 6, 'agustus': 7, 'september': 8,
  'oktober': 9, 'november': 10, 'desember': 11
};

function parseIDDate(str) {
  var s = str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  var parts = s.split(/\s+/);
  if (parts.length < 3) return new Date(2000, 0, 1);
  var d = parseInt(parts[0], 10);
  var m = BULAN[parts[1]];
  var y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) {
    return new Date(2000, 0, 1);
  }
  return new Date(y, m, d);
}

function todayAt() {
  var n = new Date();
  n.setHours(0, 0, 0, 0);
  return n.getTime();
}

function isFuture(dateStr) {
  return parseIDDate(dateStr).getTime() >= todayAt();
}

function isTodayCheck(dateStr) {
  return parseIDDate(dateStr).getTime() === todayAt();
}

function splitSchedule() {
  var upcoming = [];
  var completed = [];
  SCHEDULE_DATA.forEach(function(item) {
    var futureSched = [];
    var pastSched = [];
    item.schedule.forEach(function(s) {
      if (isFuture(s.date)) {
        futureSched.push(s);
      } else {
        pastSched.push(s);
      }
    });
    if (futureSched.length > 0) {
      upcoming.push({
        name: item.name,
        type: item.type,
        desc: item.desc,
        schedule: futureSched,
        allSchedule: item.schedule
      });
    }
    if (pastSched.length > 0) {
      completed.push({
        name: item.name,
        type: item.type,
        desc: item.desc,
        schedule: pastSched
      });
    }
  });
  return { upcoming: upcoming, completed: completed };
}

function renderSchedule() {
  var split = splitSchedule();
  var rows = [];
  var upcomingCount = 0;
  var todayCount = 0;

  split.upcoming.forEach(function(group) {
    group.schedule.forEach(function(s) {
      var isT = isTodayCheck(s.date);
      if (isT) todayCount++;
      else upcomingCount++;

      var statusCls = isT ? 'today' : 'upcoming';
      var statusTxt = isT ? 'Hari Ini' : 'Mendatang';

      rows.push(
        `<div class="sched-row sched-type-${group.type}">` +
          `<span class="sched-no">${rows.length + 1}</span>` +
          `<span class="sched-name">` +
            `<span class="sched-name-dot"></span>` +
            `<span class="sched-name-text">${group.name}</span>` +
          `</span>` +
          `<span class="sched-date">${s.date}</span>` +
          `<span class="sched-time">${s.time}</span>` +
          `<span class="sched-status-wrap">` +
            `<span class="sched-status ${statusCls}">${statusTxt}</span>` +
          `</span>` +
        `</div>`
      );
    });
  });

  var totalCompleted = 0;
  split.completed.forEach(function(g) {
    totalCompleted += g.schedule.length;
  });

  var summaryEl = document.getElementById('schedSummary');
  summaryEl.innerHTML = 
    `<div class="sched-summary-chip">` +
      `<span class="sched-summary-dot upcoming"></span>` +
      `<strong>${upcomingCount}</strong> Mendatang` +
    `</div>` +
    (todayCount > 0 ?
      `<div class="sched-summary-chip">` +
        `<span class="sched-summary-dot today"></span>` +
        `<strong>${todayCount}</strong> Hari Ini` +
      `</div>` : '') +
    `<div class="sched-summary-chip">` +
      `<strong>${totalCompleted}</strong> Selesai → Reschedule` +
    `</div>`;

  var el = document.getElementById('schedContent');
  if (rows.length === 0) {
    el.innerHTML = '<div class="sched-empty">Belum ada schedule mendatang.</div>';
  } else {
    el.innerHTML = rows.join('');
  }
}

function renderReschedule() {
  var split = splitSchedule();
  var list = split.completed;
  var total = 0, teater = 0, event = 0, digital = 0;

  list.forEach(function(g) {
    total += g.schedule.length;
    if (g.type === 'teater') teater += g.schedule.length;
    else if (g.type === 'event') event += g.schedule.length;
    else digital += g.schedule.length;
  });

  document.getElementById('rescheduleTotal').textContent = total;
  document.getElementById('rescheduleTeater').textContent = teater;
  document.getElementById('rescheduleEvent').textContent = event;
  document.getElementById('rescheduleDigital').textContent = digital;

  var el = document.getElementById('rescheduleList');
  if (list.length === 0) {
    el.innerHTML = '<div class="sched-empty">Belum ada jadwal yang selesai.</div>';
    return;
  }

  var html = '';
  list.forEach(function(item, idx) {
    var lastDate = item.schedule[item.schedule.length - 1].date;
    html += 
      `<div class="reschedule-item" style="transition-delay:${idx * 80}ms">` +
        `<div class="reschedule-item-header" onclick="showRescheduleDetail(${idx})">` +
          `<span class="reschedule-type-badge ${item.type}">${item.type}</span>` +
          `<div class="reschedule-item-info">` +
            `<div class="reschedule-item-name">${item.name}</div>` +
            `<div class="reschedule-item-date">` +
              `${item.schedule.length} jadwal &middot; terakhir ${lastDate}` +
            `</div>` +
          `</div>` +
          `<svg class="reschedule-arrow" viewBox="0 0 24 24">` +
            `<polyline points="9 18 15 12 9 6"/>` +
          `</svg>` +
        `</div>` +
      `</div>`;
  });
  el.innerHTML = html;

  setTimeout(function() {
    var items = el.querySelectorAll('.reschedule-item');
    items.forEach(function(it, i) {
      setTimeout(function() {
        it.classList.add('visible');
      }, i * 80);
    });
  }, 50);
}

function showRescheduleDetail(idx) {
  var split = splitSchedule();
  var item = split.completed[idx];
  if (!item) return;

  var listView = document.getElementById('rescheduleListView');
  listView.classList.remove('active');

  var dv = document.getElementById('rescheduleDetailView');
  dv.classList.add('active');

  var typeLabel = item.type === 'teater' ? 'Teater' :
    item.type === 'event' ? 'Event' : 'Digital';

  var rows = '';
  item.schedule.forEach(function(s, i) {
    rows += 
      `<div class="detail-table-row row-done">` +
        `<span class="detail-table-no">${i + 1}</span>` +
        `<span class="detail-table-date date-done">${s.date}</span>` +
        `<span class="detail-table-time time-done">${s.time}</span>` +
      `</div>`;
  });

  dv.innerHTML = 
    `<div class="section-header">` +
      `<button class="back-btn" onclick="closeRescheduleDetail()" aria-label="Kembali">` +
        `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>` +
      `</button>` +
      `<h2>${item.name}</h2>` +
    `</div>` +
    `<div class="detail-hero">` +
      `<div class="detail-hero-top">` +
        `<div class="detail-hero-name">${item.name}</div>` +
        `<span class="reschedule-type-badge ${item.type}" style="margin-top:8px;display:inline-flex">` +
          `${typeLabel}` +
        `</span>` +
      `</div>` +
      `<div class="detail-hero-desc">${item.desc}</div>` +
    `</div>` +
    `<div class="detail-stats">` +
      `<div class="detail-stat">` +
        `<div class="detail-stat-value">${item.schedule.length}</div>` +
        `<div class="detail-stat-label">Total Jadwal</div>` +
      `</div>` +
      `<div class="detail-stat">` +
        `<div class="detail-stat-value">${item.schedule.length}</div>` +
        `<div class="detail-stat-label">Selesai</div>` +
      `</div>` +
      `<div class="detail-stat">` +
        `<div class="detail-stat-value">0</div>` +
        `<div class="detail-stat-label">Tersisa</div>` +
      `</div>` +
    `</div>` +
    `<div class="detail-table-wrap">` +
      `<div class="detail-table-header">` +
        `<span>No</span><span>Tanggal</span><span>Waktu</span>` +
      `</div>` +
      `${rows}` +
    `</div>`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeRescheduleDetail() {
  var dv = document.getElementById('rescheduleDetailView');
  dv.classList.remove('active');
  dv.innerHTML = '';
  var listView = document.getElementById('rescheduleListView');
  listView.classList.add('active');
}

function renderHashtags() {
  var displayData = HASHTAG_DATA.slice(0, HASHTAG_DISPLAY_LIMIT);
  var html = '';
  displayData.forEach(function(h, i) {
    html += 
      `<div class="hashtag-row">` +
        `<span class="hashtag-no">${i + 1}</span>` +
        `<span class="hashtag-desc"><em>${h.desc}</em></span>` +
        `<span class="hashtag-tag">` +
          `<span class="hashtag-hash">#</span>${h.tag}` +
        `</span>` +
      `</div>`;
  });
  document.getElementById('hashtagContent').innerHTML = html;

  var seeMoreWrap = document.getElementById('hashtagSeeMoreWrap');
  if (HASHTAG_DATA.length > HASHTAG_DISPLAY_LIMIT) {
    var remaining = HASHTAG_DATA.length - HASHTAG_DISPLAY_LIMIT;
    seeMoreWrap.innerHTML = 
      `<button class="hashtag-see-more" onclick="showSection('hashtags')">` +
        `Selengkapnya ` +
        `<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg> ` +
        `<span style="opacity:.6;font-weight:400">(${remaining} lagi)</span>` +
      `</button>`;
  } else {
    seeMoreWrap.innerHTML = '';
  }
}

function renderHashtagPage(filter) {
  var data = HASHTAG_DATA;
  if (filter && filter.trim().length > 0) {
    var q = filter.toLowerCase().trim();
    data = data.filter(function(h) {
      return h.tag.toLowerCase().indexOf(q) !== -1 ||
        h.desc.toLowerCase().indexOf(q) !== -1;
    });
  }

  document.getElementById('htTotalBadge').textContent = HASHTAG_DATA.length;

  var grid = document.getElementById('htGrid');
  if (data.length === 0) {
    grid.innerHTML = '<div class="ht-empty">Tidak ada hashtag ditemukan.</div>';
    return;
  }

  var html = '';
  data.forEach(function(h, i) {
    var delay = Math.min(i * 50, 600);
    var escapedTag = h.tag.replace(/'/g, "\\'");
    html += 
      `<div class="ht-card" style="transition-delay:${delay}ms">` +
        `<div class="ht-card-no">${i + 1}</div>` +
        `<div class="ht-card-info">` +
          `<div class="ht-card-desc">${h.desc}</div>` +
        `</div>` +
        `<div class="ht-card-tag-wrap" onclick="copyHashtag(this, '${escapedTag}')" title="Klik untuk salin">` +
          `<span class="ht-copy-hint">Tersalin!</span>` +
          `<span class="ht-card-tag">` +
            `<span class="ht-card-hash">#</span>${h.tag}` +
          `</span>` +
        `</div>` +
      `</div>`;
  });
  grid.innerHTML = html;

  setTimeout(function() {
    var cards = grid.querySelectorAll('.ht-card');
    cards.forEach(function(c, idx) {
      setTimeout(function() {
        c.classList.add('visible');
      }, idx * 50);
    });
  }, 60);
}

function filterHashtags() {
  var val = document.getElementById('htSearch').value;
  renderHashtagPage(val);
}

function copyHashtag(el, tag) {
  var fullTag = '#' + tag;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullTag);
  } else {
    var ta = document.createElement('textarea');
    ta.value = fullTag;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  var hint = el.querySelector('.ht-copy-hint');
  if (hint) {
    hint.classList.add('show');
    setTimeout(function() {
      hint.classList.remove('show');
    }, 1200);
  }
}

var currentRootFolder = 'lana';
var currentSubTab = null;
var lbImages = [];
var lbIndex = 0;

function switchRootFolder(folder) {
  currentRootFolder = folder;
  currentSubTab = null;
  var tabs = document.querySelectorAll('.gal-root-tab');
  tabs.forEach(function(t) {
    var isFolder = t.getAttribute('data-folder') === folder;
    t.classList.toggle('active', isFolder);
  });
  updateGalTabs();
  renderGalFolders();
}

function updateGalTabs() {
  var fd = galleryData[currentRootFolder];
  if (!fd) return;
  var total = 0;
  fd.tabKeys.forEach(function(k) {
    total += fd.images[k].length;
  });
  var tabs = document.querySelectorAll('.gal-root-tab');
  tabs.forEach(function(t) {
    if (t.getAttribute('data-folder') === currentRootFolder) {
      t.querySelector('.gal-root-tab-count').textContent = total;
    }
  });
}

function renderGalFolders() {
  var fd = galleryData[currentRootFolder];
  if (!fd) return;
  var el = document.getElementById('galContent');
  var html = '<div class="gal-folders-grid">';

  fd.tabKeys.forEach(function(key) {
    var imgs = fd.images[key];
    var label = fd.tabLabels[key] || key;
    var cover = imgs.length > 0 ? imgs[imgs.length - 1].src : '';

    html += 
      `<div class="gal-folder-card" onclick="openGalSubTab('${key}')">` +
        `<div class="gal-folder-cover">` +
          (cover ?
            `<img src="${cover}" alt="${label}" loading="lazy">` :
            `<div style="width:100%;height:100%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:.8rem">Kosong</div>`) +
          `<div class="gal-folder-cover-overlay"></div>` +
          (imgs.length > 0 ?
            `<div class="gal-folder-badge">` +
              `<span class="gal-folder-badge-dot"></span>${imgs.length} foto` +
            `</div>` : '') +
        `</div>` +
        `<div class="gal-folder-info">` +
          `<div class="gal-folder-icon">` +
            `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>` +
          `</div>` +
          `<div class="gal-folder-text">` +
            `<div class="gal-folder-name">${label}</div>` +
            `<div class="gal-folder-count"><span>${imgs.length}</span> foto</div>` +
          `</div>` +
          `<svg class="gal-folder-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>` +
        `</div>` +
      `</div>`;
  });

  html += '</div>';
  el.innerHTML = html;

  setTimeout(function() {
    var cards = el.querySelectorAll('.gal-folder-card');
    cards.forEach(function(c, i) {
      setTimeout(function() {
        c.classList.add('visible');
      }, i * 100);
    });
  }, 50);
}

function openGalSubTab(key) {
  currentSubTab = key;
  var fd = galleryData[currentRootFolder];
  var originalImgs = fd.images[key];
  var imgs = originalImgs.slice().reverse();
  var label = fd.tabLabels[key] || key;
  var el = document.getElementById('galContent');

  var html = 
    `<div class="gal-photos-header">` +
      `<button class="back-btn" onclick="renderGalFolders()" aria-label="Kembali">` +
        `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>` +
      `</button>` +
      `<h3>${label}</h3>` +
      `<span class="gal-photos-count">${imgs.length} foto</span>` +
    `</div>`;

  if (imgs.length === 0) {
    html += '<div class="gal-masonry"><div class="gal-empty">Belum ada foto di album ini.</div></div>';
  } else {
    html += '<div class="gal-masonry">';
    imgs.forEach(function(img, i) {
      html += 
        `<div class="gal-item" onclick="openLightbox(${i})">` +
          `<div class="gal-item-img-wrap">` +
            `<img src="${img.src}" alt="${img.alt}" loading="lazy">` +
          `</div>` +
          `<div class="gal-item-overlay">` +
            `<div class="gal-item-zoom">` +
              `<svg viewBox="0 0 24 24">` +
                `<circle cx="11" cy="11" r="8"/>` +
                `<line x1="21" y1="21" x2="16.65" y2="16.65"/>` +
                `<line x1="11" y1="8" x2="11" y2="14"/>` +
                `<line x1="8" y1="11" x2="14" y2="11"/>` +
              `</svg>` +
            `</div>` +
          `</div>` +
        `</div>`;
    });
    html += '</div>';
  }

  el.innerHTML = html;
  lbImages = imgs;

  setTimeout(function() {
    var items = el.querySelectorAll('.gal-item');
    items.forEach(function(it, i) {
      setTimeout(function() {
        it.classList.add('visible');
      }, i * 60);
    });
  }, 50);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openLightbox(idx) {
  lbIndex = idx;
  updateLightbox();
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function lightboxNav(dir) {
  lbIndex += dir;
  if (lbIndex < 0) lbIndex = lbImages.length - 1;
  if (lbIndex >= lbImages.length) lbIndex = 0;
  updateLightbox();
}

function updateLightbox() {
  var img = document.getElementById('lightboxImg');
  img.style.opacity = '0';
  setTimeout(function() {
    img.src = lbImages[lbIndex].src;
    img.alt = lbImages[lbIndex].alt;
    img.style.opacity = '1';
  }, 150);

  document.getElementById('lbCounter').textContent =
    (lbIndex + 1) + ' / ' + lbImages.length;
  document.getElementById('lbPrev').classList.toggle('disabled', lbImages.length <= 1);
  document.getElementById('lbNext').classList.toggle('disabled', lbImages.length <= 1);
}

document.addEventListener('keydown', function(e) {
  var lb = document.getElementById('lightbox');
  if (!lb.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxNav(-1);
  if (e.key === 'ArrowRight') lightboxNav(1);
});

function enterSite() {
  var hero = document.getElementById('heroSection');
  var main = document.getElementById('mainContent');
  var nav = document.getElementById('topnav');

  hero.style.opacity = '0';
  hero.style.transition = 'opacity .5s';

  setTimeout(function() {
    hero.style.display = 'none';
    main.style.display = 'block';
    nav.classList.add('visible');
    document.body.classList.add('scrolled');
    window.scrollTo(0, 0);

    loadSchedules().then(function() {
      renderSchedule();
      renderReschedule();
    });
    loadHashtags().then(function() {
      renderHashtags();
    });
    loadGallery().then(function() {
      updateGalTabs();
      renderGalFolders();
    });

    var sections = document.querySelectorAll('.section');
    sections.forEach(function(s) {
      s.classList.remove('active');
    });
    document.getElementById('profile').classList.add('active');

    var links = document.querySelectorAll('.topnav-link[data-section]');
    links.forEach(function(l) {
      var isProfile = l.getAttribute('data-section') === 'profile';
      l.classList.toggle('current', isProfile);
    });
    updateMobileMenuCurrent('profile');
  }, 500);
}

function backToHero() {
  closeMobileMenu();
  var hero = document.getElementById('heroSection');
  var main = document.getElementById('mainContent');
  var nav = document.getElementById('topnav');

  main.style.display = 'none';
  nav.classList.remove('visible');
  document.body.classList.remove('scrolled');
  hero.style.display = 'flex';
  hero.style.opacity = '1';
  window.scrollTo(0, 0);
}

function showSection(id) {
  if (id !== 'reschedule') {
    closeRescheduleDetail();
  } else {
    closeRescheduleDetail();
    renderReschedule();
  }

  var sections = document.querySelectorAll('.section');
  sections.forEach(function(s) {
    s.classList.remove('active');
  });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');

  var links = document.querySelectorAll('.topnav-link[data-section]');
  links.forEach(function(l) {
    var isCurrent = l.getAttribute('data-section') === id;
    l.classList.toggle('current', isCurrent);
  });
  updateMobileMenuCurrent(id);

  if (id === 'gallery') {
    loadGallery().then(function() {
      updateGalTabs();
      renderGalFolders();
    });
  }
  if (id === 'hashtags') {
    loadHashtags().then(function() {
      renderHashtagPage();
    });
  }
  if (id === 'reschedule') {
    renderReschedule();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

(function() {
  var c = document.getElementById('particles');
  if (!c) return;
  for (var i = 0; i < 30; i++) {
    var p = document.createElement('div');
    p.className = 'hero-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = '-10px';
    p.style.animationDuration = (6 + Math.random() * 8) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.width = p.style.height = (1 + Math.random() * 2) + 'px';
    c.appendChild(p);
  }
})();

window.addEventListener('scroll', function() {
  var btn = document.getElementById('backToTop');
  var nav = document.getElementById('topnav');
  var y = window.scrollY || window.pageYOffset;
  btn.classList.toggle('visible', y > 400);
  nav.classList.toggle('scrolled', y > 10);
});