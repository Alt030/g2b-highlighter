// ==UserScript==
// @name         G2B Highlighter
// @namespace    http://tampermonkey.net/
// @version      2025-01-06
// @description  Virtual scroll 환경에서의 입찰공고 하이라이트 기능
// @author       You
// @match        https://www.g2b.go.kr/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 스타일 정의
    const addStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .bid-highlighted {
                color: green !important;
                text-decoration: none !important;
            }
            .bid-highlighted:visited {
                color: green !important;
            }
        `;
        document.head.appendChild(style);
    };

    // 클릭 이벤트 핸들러 - 이벤트 위임 방식 사용
    const handleBidClick = (event) => {
        const link = event.target.closest('td[col_id="bidPbancNm"] nobr a');
        if (!link) return;

        const bidName = link.innerText.trim();
        const bidRow = link.closest('tr');
        const bidNumberCell = bidRow.querySelector('td[col_id="bidPbancUntyNoOrd"] nobr');
        const bidNumber = bidNumberCell ? bidNumberCell.innerText.trim() : '';

        if (!bidNumber) return;

        const clickedBids = JSON.parse(localStorage.getItem('clickedBids')) || [];
        const bidIdentifier = `${bidName}||${bidNumber}`;

        // 중복 체크 후 저장
        if (!clickedBids.includes(bidIdentifier)) {
            clickedBids.push(bidIdentifier);
            localStorage.setItem('clickedBids', JSON.stringify(clickedBids));
            console.log(`Saved bid: ${bidName} (${bidNumber})`);
        }
    };

    // 가상 스크롤 환경에서의 하이라이트 적용 함수
    const applyHighlight = () => {
        const clickedBids = JSON.parse(localStorage.getItem('clickedBids')) || [];
        const bidLinks = document.querySelectorAll('td[col_id="bidPbancNm"] nobr a:not(.processed)');

        bidLinks.forEach(link => {
            link.classList.add('processed');
            const bidName = link.innerText.trim();
            const bidRow = link.closest('tr');
            const bidNumberCell = bidRow.querySelector('td[col_id="bidPbancUntyNoOrd"] nobr');
            const bidNumber = bidNumberCell ? bidNumberCell.innerText.trim() : '';

            if (!bidNumber) return;

            const bidIdentifier = `${bidName}||${bidNumber}`;
            if (clickedBids.includes(bidIdentifier)) {
                link.classList.add('bid-highlighted');
            }
        });
    };

    // DOM 변경 감지를 위한 옵저버 설정
    const setupObserver = () => {
        const dataLayer = document.querySelector('#mf_wfm_container_tacBidPbancLst_contents_tab2_body_gridView1_dataLayer');

        if (dataLayer) {
            const observer = new MutationObserver(() => {
                requestAnimationFrame(applyHighlight);
            });

            observer.observe(dataLayer, {
                childList: true,
                subtree: true,
                characterData: false,
                attributes: false
            });
        } else {
            setTimeout(setupObserver, 500);
        }
    };

    // 초기화 함수
    const initialize = () => {
        addStyles();

        // 이벤트 위임을 사용한 클릭 이벤트 처리
        document.addEventListener('click', handleBidClick, true);

        // 스크롤 이벤트 처리
        const scrollContainer = document.querySelector('#mf_wfm_container_tacBidPbancLst_contents_tab2_body_gridView1_scrollY_div');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', () => {
                requestAnimationFrame(applyHighlight);
            }, { passive: true });
        }

        applyHighlight();
        setupObserver();
    };

    // 페이지 로드 및 뒤로가기 처리
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log('Page restored from bfcache');
        }
        initialize();
    });

    // popstate 이벤트도 처리 (뒤로가기/앞으로가기)
    window.addEventListener('popstate', () => {
        console.log('Navigation occurred');
        setTimeout(initialize, 100);
    });

    // 초기 실행
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
