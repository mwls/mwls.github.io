/* Kazakhstan Teaching Blog: filter, tag, paginate */
(function () {
	var PER_PAGE = 5;

	var TIME_LABEL  = {
		2026: '2026',
		2025: '2025',
		'2020-2024': '2020-2024',
		'2017-2019': '2017-2019'
	};
	var TOPIC_ICON  = { astrophoto:'&#128301;', gaming:'&#127918;', kazakhstan:'&#127472;&#127487;', research:'&#128104;&#8205;&#128300;', sports:'&#127945;', teaching:'&#127891;', travel:'&#9992;', other:'&#10067;' };
	var TOPIC_LABEL = { astrophoto:'Astrophotography', gaming:'Gaming', kazakhstan:'Kazakhstan', research:'Research', sports:'Sports', teaching:'Teaching', travel:'Travel', other:'Other' };

	var posts = [];
	var timeFilter  = 'all';
	var topicFilter = 'all';
	var newestFirst = true;
	var visible     = PER_PAGE;
	var timeDataAttr = 'blogYear';

	function getSortedPosts() {
		return posts.slice().sort(function (a, b) {
			var aIdx = parseInt(a.dataset.domIndex || '0', 10);
			var bIdx = parseInt(b.dataset.domIndex || '0', 10);
			return newestFirst ? (aIdx - bIdx) : (bIdx - aIdx);
		});
	}

	function updateSortButtons() {
		document.querySelectorAll('[data-filter-sort]').forEach(function (btn) {
			var value = (btn.getAttribute('data-filter-sort') || '').toLowerCase();
			var isActive = (newestFirst && value === 'newest') || (!newestFirst && value === 'oldest');
			btn.classList.toggle('active', isActive);
		});
	}

	/* 1. Tag each blog-post section */
	function initPosts() {
		var loadMore = document.getElementById('load-more-section');
		var selector = document.querySelector('section.wrapper[data-blog-year]')
			? 'section.wrapper[data-blog-year]'
			: 'section.wrapper[data-blog-week]';
		timeDataAttr = (selector.indexOf('blog-week') !== -1) ? 'blogWeek' : 'blogYear';

		Array.from(document.querySelectorAll(selector)).forEach(function (sec, idx) {
			var h2 = sec.querySelector('h2');
			if (!h2) return;
			var txt = h2.textContent.trim();
			var key = null;
			if (/epilogue/i.test(txt)) {
				key = 'epilogue';
			} else {
				var m = txt.match(/Day\s+([\d.]+)/i);
				if (m) key = m[1];
			}

			sec.classList.add('blog-post');
			var timeValue = sec.dataset[timeDataAttr] || '';
			var topicsStr = sec.dataset.blogTopics || '';
			var order = parseFloat(sec.dataset.blogOrder || '0');
			sec.dataset.time = timeValue;
			sec.dataset.topics = topicsStr;
			sec.dataset.order = order;
			sec.dataset.domIndex = idx;
			sec.id = (key === 'epilogue') ? 'epilogue' : ('day' + key.replace('.', '-'));

			// Inject tag pills after the giscus comment box (or after heading if no giscus)
			var giscusEl = sec.querySelector('.giscus, script[data-repo="mwls/mwlsmith-comments"]');
			var anchor = giscusEl || h2.closest('p') || h2.parentNode;
			if (anchor) {
				var html = '<div class="post-tags"><span class="post-tag">' + (TIME_LABEL[timeValue] || timeValue) + '</span>';
				topicsStr.split(' ').forEach(function (t) {
					if (t) html += '<span class="post-tag">' + (TOPIC_ICON[t] || '') + ' ' + (TOPIC_LABEL[t] || t) + '</span>';
				});
				html += '</div>';
				anchor.insertAdjacentHTML('afterend', html);
			}
			posts.push(sec);
		});

		/* 2. Reorder DOM by selected sort */
		getSortedPosts().forEach(function (p) { p.parentNode.insertBefore(p, loadMore); });
	}

	/* 3. Filtering */
	function matching() {
		return getSortedPosts().filter(function (p) {
			var yOk = timeFilter  === 'all' || p.dataset.time === timeFilter;
			var tOk = topicFilter === 'all' || p.dataset.topics.split(' ').indexOf(topicFilter) !== -1;
			return yOk && tOk;
		});
	}

	function setActiveButton(selector, value) {
		var target = null;
		document.querySelectorAll(selector).forEach(function (btn) {
			if ((btn.getAttribute(selector === '[data-filter-time]' ? 'data-filter-time' : 'data-filter-topic') || '').toLowerCase() === value.toLowerCase()) {
				target = btn;
			}
		});
		if (!target) return false;
		document.querySelectorAll(selector).forEach(function (b) { b.classList.remove('active'); });
		target.classList.add('active');
		return true;
	}

	function applyInitialFiltersFromUrl() {
		var params = new URLSearchParams(window.location.search);
		var urlTime = (
			params.get('time') ||
			params.get('year') ||
			params.get('week') ||
			params.get('filterTime') ||
			params.get('filter-time') ||
			''
		).trim();
		var urlTopic = (
			params.get('topic') ||
			params.get('filterTopic') ||
			params.get('filter-topic') ||
			''
		).trim();
		var urlOrder = (
			params.get('order') ||
			params.get('sort') ||
			''
		).trim().toLowerCase();

		if (urlTime && setActiveButton('[data-filter-time]', urlTime)) {
			timeFilter = urlTime;
		}
		if (urlTopic && setActiveButton('[data-filter-topic]', urlTopic)) {
			topicFilter = urlTopic;
		}
		if (urlOrder === 'oldest' || urlOrder === 'asc' || urlOrder === 'ascending') {
			newestFirst = false;
		}
		if (urlOrder === 'newest' || urlOrder === 'desc' || urlOrder === 'descending') {
			newestFirst = true;
		}
	}

	function syncUrlWithFilters() {
		var url = new URL(window.location.href);
		if (timeFilter === 'all') {
			url.searchParams.delete('time');
		} else {
			url.searchParams.set('time', timeFilter);
		}
		if (topicFilter === 'all') {
			url.searchParams.delete('topic');
		} else {
			url.searchParams.set('topic', topicFilter);
		}
		if (newestFirst) {
			url.searchParams.delete('order');
		} else {
			url.searchParams.set('order', 'oldest');
		}
		window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : ''));
	}

	/* 4. Render visible posts + update controls */
	function render() {
		var loadMore = document.getElementById('load-more-section');
		getSortedPosts().forEach(function (p) { p.parentNode.insertBefore(p, loadMore); });

		var m = matching();
		posts.forEach(function (p) { p.style.display = 'none'; });
		m.slice(0, visible).forEach(function (p) { p.style.display = ''; });

		var countEl = document.getElementById('blog-post-count');
		if (countEl) {
			var shown = Math.min(m.length, visible);
			if (m.length === 0) {
				countEl.textContent = '';
			} else if (shown >= m.length) {
				countEl.textContent = 'Showing all ' + m.length + ' post' + (m.length !== 1 ? 's' : '') + '.';
			} else {
				countEl.textContent = 'Showing ' + shown + ' of ' + m.length + ' posts.';
			}
		}

		var lms   = document.getElementById('load-more-section');
		var lmb   = document.getElementById('load-more-btn');
		var noRes = document.getElementById('no-results');
		if (m.length === 0) {
			if (noRes) noRes.style.display = 'block';
			if (lmb)  lmb.style.display   = 'none';
			if (lms)  lms.style.display   = '';
		} else if (visible < m.length) {
			if (noRes) noRes.style.display = 'none';
			if (lmb)  lmb.style.display   = '';
			if (lms)  lms.style.display   = '';
		} else {
			if (noRes) noRes.style.display = 'none';
			if (lmb)  lmb.style.display   = 'none';
			if (lms)  lms.style.display   = 'none';
		}
	}

	/* 5. Events */
	function attachFilters() {
		function scrollToFilters() {
			var f = document.getElementById('blog-filters');
			if (f) f.scrollIntoView({ behavior: 'smooth' });
		}

		var sortButtons = document.querySelectorAll('[data-filter-sort]');
		if (sortButtons.length === 0) {
			var countEl = document.getElementById('blog-post-count');
			if (countEl && countEl.parentNode) {
				countEl.insertAdjacentHTML('beforebegin',
					'<div style="margin-top:0.6em; margin-bottom:0.4em;">' +
						'<span class="blog-filter-label">Sort Posts</span>' +
						'<div class="blog-filter-group">' +
							'<button class="filter-btn" data-filter-sort="newest" type="button">Most Recent First</button>' +
							'<button class="filter-btn" data-filter-sort="oldest" type="button">Oldest First</button>' +
						'</div>' +
					'</div>'
				);
				sortButtons = document.querySelectorAll('[data-filter-sort]');
			}
		}
		if (sortButtons.length > 0) {
			updateSortButtons();
			sortButtons.forEach(function (btn) {
				btn.addEventListener('click', function () {
					newestFirst = this.dataset.filterSort === 'newest';
				visible = PER_PAGE;
				updateSortButtons();
				render();
				syncUrlWithFilters();
				scrollToFilters();
				});
			});
		}

		document.querySelectorAll('[data-filter-time]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				document.querySelectorAll('[data-filter-time]').forEach(function (b) { b.classList.remove('active'); });
				this.classList.add('active');
				timeFilter = this.dataset.filterTime;
				visible = PER_PAGE;
				render();
				syncUrlWithFilters();
				scrollToFilters();
			});
		});
		document.querySelectorAll('[data-filter-topic]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				document.querySelectorAll('[data-filter-topic]').forEach(function (b) { b.classList.remove('active'); });
				this.classList.add('active');
				topicFilter = this.dataset.filterTopic;
				visible = PER_PAGE;
				render();
				syncUrlWithFilters();
				scrollToFilters();
			});
		});
		var lmb = document.getElementById('load-more-btn');
		if (lmb) {
			lmb.addEventListener('click', function () {
				visible += PER_PAGE;
				render();
			});
		}
	}

	/* 6. Hash navigation: reveal post if linked directly */
	function handleHash() {
		if (!window.location.hash) return;
		var target = document.querySelector(window.location.hash);
		if (target && target.classList.contains('blog-post')) {
			visible = posts.length;
			render();
			setTimeout(function () { target.scrollIntoView({ behavior: 'smooth' }); }, 80);
		}
	}

	/* Giscus auth/session helper */
	function getGiscusSession() {
		var url = new URL(window.location.href);
		var fromUrl = url.searchParams.get('giscus');
		if (fromUrl) {
			try { localStorage.setItem('giscus-session', JSON.stringify(fromUrl)); } catch (e) {}
			url.searchParams.delete('giscus');
			history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : ''));
			return fromUrl;
		}
		try {
			var stored = localStorage.getItem('giscus-session');
			if (stored) return JSON.parse(stored);
		} catch (e) {}
		return '';
	}

	/* Giscus iframes: align origin/backLink with current URL, then resize on postMessage */
	(function syncGiscusIframeParams() {
		var pageUrl = new URL(window.location.href);
		pageUrl.searchParams.delete('giscus');
		pageUrl.hash = '';
		var cleanUrl = pageUrl.toString();
		var pageOrigin = pageUrl.origin;
		var session = getGiscusSession();

		document.querySelectorAll('iframe.giscus-frame').forEach(function (iframe) {
			try {
				var term = iframe.getAttribute('data-term');
				if (!term) return;
				var u = new URL('https://giscus.app/en/widget');
				u.searchParams.set('origin', pageOrigin);
				u.searchParams.set('session', session || '');
				u.searchParams.set('theme', 'light');
				u.searchParams.set('reactionsEnabled', '1');
				u.searchParams.set('emitMetadata', '0');
				u.searchParams.set('inputPosition', 'bottom');
				u.searchParams.set('repo', 'mwls/mwlsmith-comments');
				u.searchParams.set('repoId', 'R_kgDOR7bWuw');
				u.searchParams.set('category', 'Blog Post Comments');
				u.searchParams.set('categoryId', 'DIC_kwDOR7bWu84C6MXd');
				u.searchParams.set('strict', '0');
				u.searchParams.set('description', '');
				u.searchParams.set('backLink', cleanUrl);
				u.searchParams.set('mapping', 'specific');
				u.searchParams.set('term', term);
				iframe.setAttribute('src', u.toString());
			} catch (err) {}
		});
	}());

	/* Giscus iframe: resize on postMessage */
	window.addEventListener('message', function (e) {
		if (e.origin !== 'https://giscus.app') return;
		if (typeof e.data === 'object' && e.data.giscus && e.data.giscus.signOut) {
			try { localStorage.removeItem('giscus-session'); } catch (err) {}
			window.location.reload();
			return;
		}
		if (typeof e.data !== 'object' || !e.data.giscus || !e.data.giscus.resizeHeight) return;
		document.querySelectorAll('iframe.giscus-frame').forEach(function (iframe) {
			try { if (iframe.contentWindow === e.source) iframe.style.height = e.data.giscus.resizeHeight + 'px'; } catch (err) {}
		});
	});

	/* Init */
	initPosts();
	applyInitialFiltersFromUrl();
	attachFilters();
	updateSortButtons();
	render();
	handleHash();
}());
