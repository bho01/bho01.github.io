/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2015, Codrops
 * http://www.codrops.com
 */
;window.PageStack = (function(window) {

	'use strict';

	var support = { transitions: Modernizr.csstransitions },
		// transition end event name
		transEndEventNames = { 'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend' },
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		onEndTransition = function( el, callback ) {
			var onEndCallbackFn = function( ev ) {
				if( support.transitions ) {
					if( ev.target != this ) return;
					this.removeEventListener( transEndEventName, onEndCallbackFn );
				}
				if( callback && typeof callback === 'function' ) { callback.call(this); }
			};
			if( support.transitions ) {
				el.addEventListener( transEndEventName, onEndCallbackFn );
			}
			else {
				onEndCallbackFn();
			}
		},
		// the pages wrapper
		stack = document.querySelector('.pages-stack'),
		// the page elements
		pages = [].slice.call(stack.children),
		// total number of page elements
		pagesTotal = pages.length,
		// index of current page
		current = (window.location.href && findWithAttr(pages, "id", getURLPageId()) > 0 ? findWithAttr(pages, "id", getURLPageId()) : 0),
		// menu button
		menuCtrl = document.querySelector('button.menu-button'),
		menuWrap = document.getElementById('menuWrap'),
		// the navigation wrapper
		nav = document.querySelector('.pages-nav'),
		// the menu nav items
		navItems = [].slice.call(nav.querySelectorAll('.link--page')),
		// check if menu is open
		isMenuOpen = false,
		//callbacks
		onMenuOpen,
		onMenuClose,
		onPageOpen, onPageOpenId,
		onPageClose, onPageCloseId,
		openPageEvent;


	function PageStack () {
		init()
	}

	PageStack.prototype.onMenuOpen = function(callback) {
		onMenuOpen = callback;
	};
	PageStack.prototype.onMenuClose = function(callback) {
		onMenuClose = callback;
	};
	PageStack.prototype.onPageOpen = function(pageId, callback) {
		onPageOpenId = pageId;
		onPageOpen = callback;
	};
	PageStack.prototype.onPageClose = function(pageId, callback) {
		onPageCloseId = pageId;
		onPageClose = callback;
	};

	function init() {
		buildStack();
		initEvents();
	}

	function buildStack() {
        //debugger;

		var stackPagesIdxs = getStackPagesIdxs();

		// set z-index, opacity, initial transforms to pages and add class page--inactive to all except the current one
		for(var i = 0; i < pagesTotal; ++i) {
			var page = pages[i],
				posIdx = stackPagesIdxs.indexOf(i);

			if( current !== i ) {
				classie.add(page, 'page--inactive');

				if( posIdx !== -1 ) {
					// visible pages in the stack
					page.style.WebkitTransform = 'translate3d(0,100%,0)';
					page.style.transform = 'translate3d(0,100%,0)';
				}
				else {
					// invisible pages in the stack
					page.style.WebkitTransform = 'translate3d(0,75%,-300px)';
					page.style.transform = 'translate3d(0,75%,-300px)';		
				}
			}
			else {
				classie.remove(page, 'page--inactive');
			}

			page.style.zIndex = i < current ? parseInt(current - i) : parseInt(pagesTotal + current - i);
			
			if( posIdx !== -1 ) {
				page.style.opacity = parseFloat(1 - 0.1 * posIdx);
			}
			else {
				page.style.opacity = 0;
			}
		}
	}

    function findWithAttr(array, attr, value) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr] === value) {
                return i;
            }
        }
    }

	// event binding
	function initEvents() {
		// menu button click
		//menuCtrl.addEventListener('click', toggleMenu);
		menuWrap.addEventListener('click', toggleMenu);

		// navigation menu clicks
		navItems.forEach(function(item) {
			// which page to open?
			var pageid = item.getAttribute('href').slice(1);
			item.addEventListener('click', function(ev) {
				ev.preventDefault();
				openPage(pageid);
				window.history.pushState(pageid, "", pageid);
			});
		});

		//// clicking on a page when the menu is open triggers the menu to close again and open the clicked page
		pages.forEach(function(page) {
			var pageid = page.getAttribute('id');
			page.addEventListener('click', function(ev) {
				if( isMenuOpen ) {
					ev.preventDefault();
					openPage(pageid);
                    window.history.pushState(pageid, "", pageid);
                }
			});
		});

		// keyboard navigation events
		document.addEventListener( 'keydown', function( ev ) {
			if( !isMenuOpen ) return; 
			var keyCode = ev.keyCode || ev.which;
			if( keyCode === 27 ) {
				closeMenu();
			}
		} );

		window.onpopstate = function(e) {
			e.preventDefault();
			var id = getURLPageId();
			if(openPageEvent){
				clearTimeout(openPageEvent)
			}
			if(findWithAttr(pages, "id", id) === current) {
				if(isMenuOpen)
					closeMenu();
			}
			else {
				if(!isMenuOpen) {
					toggleMenu();
				}
				openPageEvent = setTimeout(function() {
					if(!isMenuOpen) {
						openMenu(function() {openPage(id)}.bind(this))
					}
					else {
						openPage(id)
					}
					openPageEvent = null;
				}, 500)
			}
		};

	}

	function getURLPageId() {
		var a = document.createElement('a');
		a.href = window.location.href;
		var array = a.pathname.split('/');
		var pageId = array[array.length - 1];
		return pageId || 'home'
	}
	// toggle menu fn
	function toggleMenu() {
		if( isMenuOpen ) {
			closeMenu();
		}
		else {
			openMenu();
			isMenuOpen = true;
		}
	}

	// opens the menu
	function openMenu(callback) {
		// toggle the menu button
		classie.add(menuCtrl, 'menu-button--open');
		// stack gets the class "pages-stack--open" to add the transitions
		classie.add(stack, 'pages-stack--open');
		// reveal the menu
		classie.add(nav, 'pages-nav--open');

		// now set the page transforms
		var stackPagesIdxs = getStackPagesIdxs();
		for(var i = 0, len = stackPagesIdxs.length; i < len; ++i) {
			var page = pages[stackPagesIdxs[i]];
			page.style.WebkitTransform = 'translate3d(0, 75%, ' + parseInt(-1 * 200 - 50*i) + 'px)'; // -200px, -230px, -260px
			page.style.transform = 'translate3d(0, 75%, ' + parseInt(-1 * 200 - 50*i) + 'px)';
		}
		if(callback)
			onEndTransition(page, callback);

		if(onMenuOpen)
			onMenuOpen();
	}

	// closes the menu
	function closeMenu() {
		// same as opening the current page again
		openPage();
		if(onMenuClose)
			onMenuClose();
	}

	// opens a page
	function openPage(id) {
		var futurePage = id ? document.getElementById(id) : pages[current],
			futureCurrent = pages.indexOf(futurePage),
			stackPagesIdxs = getStackPagesIdxs(futureCurrent),
			oldPage = current;

		// set transforms for the new current page
		futurePage.style.WebkitTransform = 'translate3d(0, 0, 0)';
		futurePage.style.transform = 'translate3d(0, 0, 0)';
		futurePage.style.opacity = 1;

		// set transforms for the other items in the stack
		for(var i = 0, len = stackPagesIdxs.length; i < len; ++i) {
			var page = pages[stackPagesIdxs[i]];
			page.style.WebkitTransform = 'translate3d(0,100%,0)';
			page.style.transform = 'translate3d(0,100%,0)';
		}

		// set current
		if( id ) {
			current = futureCurrent;
		}
		
		// close menu..
		classie.remove(menuCtrl, 'menu-button--open');
		classie.remove(nav, 'pages-nav--open');
		onEndTransition(futurePage, function() {
			classie.remove(stack, 'pages-stack--open');
			// reorganize stack
			buildStack();
			isMenuOpen = false;
			if(onPageOpen  && (findWithAttr(pages, "id", onPageOpenId) !== oldPage) && (onPageOpenId === getURLPageId())){
				onPageOpen();
			}
			if(onPageClose && (findWithAttr(pages, "id", onPageCloseId) === oldPage) && (getURLPageId() !== onPageCloseId)){
				onPageClose();
			}

		});

	}

	// gets the current stack pages indexes. If any of them is the excludePage then this one is not part of the returned array
	function getStackPagesIdxs(excludePageIdx) {
        var nextStackPageIdx = current + 1 < pagesTotal ? current + 1 : 0,
			nextStackPageIdx_2 = current + 2 < pagesTotal ? current + 2 : 1,
			idxs = [],

			excludeIdx = excludePageIdx || -1;

		if( excludePageIdx != current ) {
			idxs.push(current);
		}
		if( excludePageIdx != nextStackPageIdx ) {
			idxs.push(nextStackPageIdx);
		}
		if( excludePageIdx != nextStackPageIdx_2 ) {
			idxs.push(nextStackPageIdx_2);
		}

		return idxs;
	}

	return new PageStack;

})(window);