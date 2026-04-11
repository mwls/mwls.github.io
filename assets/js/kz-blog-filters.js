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
	var visible     = PER_PAGE;
	var timeDataAttr = 'blogYear';

	/* 1. Tag each blog-post section */
	function initPosts() {
		var loadMore = document.getElementById('load-more-section');
		var selector = document.querySelector('section.wrapper[data-blog-year]')
			? 'section.wrapper[data-blog-year]'
			: 'section.wrapper[data-blog-week]';
		timeDataAttr = (selector.indexOf('blog-week') !== -1) ? 'blogWeek' : 'blogYear';

		Array.from(document.querySelectorAll(selector)).forEach(function (sec) {
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
			sec.id = (key === 'epilogue') ? 'epilogue' : ('day' + key.replace('.', '-'));

			// Inject tag pills after the giscus comment box (or after heading if no giscus)
			var giscusScript = sec.querySelector('script[data-repo="mwls/mwlsmith-comments"]');
			var anchor = giscusScript || h2.closest('p') || h2.parentNode;
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

		/* 2. Reorder DOM: newest first (Epilogue … Day 18 … Day 1) */
		posts.sort(function (a, b) { return parseFloat(b.dataset.order) - parseFloat(a.dataset.order); });
		posts.forEach(function (p) { p.parentNode.insertBefore(p, loadMore); });
	}

	/* 3. Filtering */
	function matching() {
		return posts.filter(function (p) {
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

		if (urlTime && setActiveButton('[data-filter-time]', urlTime)) {
			timeFilter = urlTime;
		}
		if (urlTopic && setActiveButton('[data-filter-topic]', urlTopic)) {
			topicFilter = urlTopic;
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
		window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : ''));
	}

	/* 4. Render visible posts + update controls */
	function render() {
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

	/* Init */
	initPosts();
	applyInitialFiltersFromUrl();
	attachFilters();
	render();
	handleHash();
}());
