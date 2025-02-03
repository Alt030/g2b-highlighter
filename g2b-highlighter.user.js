// ==UserScript==
// @name         G2B Highlighter (수정 버전)
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  가상 스크롤 환경에서 입찰공고 클릭 기록에 따른 하이라이트(공고번호 변경 시 하이라이트 제거)
// @author       You
// @match        https://www.g2b.go.kr/*
// @downloadURL  https://github.com/Alt030/g2b-highlighter/raw/refs/heads/main/g2b-highlighter.user.js
// @updateURL    https://github.com/Alt030/g2b-highlighter/raw/refs/heads/main/g2b-highlighter.user.js
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

    // 하이라이트 적용 함수 (모든 링크를 매번 검사)
    const applyHighlight = () => {
        const clickedBids = JSON.parse(localStorage.getItem('clickedBids')) || [];
        // 테이블에 존재하는 모든 입찰 공고 링크를 검사합니다.
        const bidLinks = document.querySelectorAll('td[col_id="bidPbancNm"] nobr a');
        bidLinks.forEach(link => {
            const bidName = link.innerText.trim();
            const bidRow = link.closest('tr');
            const bidNumberCell = bidRow.querySelector('td[col_id="bidPbancUntyNoOrd"] nobr');
            const bidNumber = bidNumberCell ? bidNumberCell.innerText.trim() : '';

            if (!bidNumber) return;

            const bidIdentifier = `${bidName}||${bidNumber}`;
            // 저장된 클릭 기록과 일치하면 하이라이트, 그렇지 않으면 제거
            if (clickedBids.includes(bidIdentifier)) {
                link.classList.add('bid-highlighted');
            } else {
                link.classList.remove('bid-highlighted');
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

        // 스크롤 이벤트 처리 (스크롤 시에도 하이라이트를 재검사)
        const scrollContainer = document.querySelector('#mf_wfm_container_tacBidPbancLst_contents_tab2_body_gridView1_scrollY_div');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', () => {
                requestAnimationFrame(applyHighlight);
            }, { passive: true });
        }

        applyHighlight();
        setupObserver();
    };

    // 페이지 로드 및 bfcache 복원 처리
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log('Page restored from bfcache');
        }
        initialize();
    });

    // popstate 이벤트 (뒤로가기/앞으로가기) 처리
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
