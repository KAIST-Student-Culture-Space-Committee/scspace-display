<script lang="ts">
	import { onMount } from 'svelte';
	import { HISTORY_LIMIT } from '../static/const';

	let currentText = '';
	let messages: string[] = ['1', '2', '3', '4'];
	let recentMessages: string[] = [];
	let connectionStatus: 'connecting' | 'open' | 'error' = 'connecting';
	let errorMessage = '';
	let lastUpdated = new Date().toLocaleString();

	onMount(() => {
		const eventSource = new EventSource('/api/refresh');

		eventSource.onopen = () => {
			connectionStatus = 'open';
			errorMessage = '';
		};

		eventSource.onmessage = (event) => {
			try {
				const payload = JSON.parse(event.data);
				if (payload.type === 'text') {
					const next = payload.text ?? '';
					// messages = [...messages.slice(-(HISTORY_LIMIT - 1)), next];
					currentText = next;
				}
				if (payload.type === 'refresh') {
					// No text change; this event just bumps the live timestamp.
				}
				lastUpdated = new Date().toLocaleString();
			} catch (error) {
				console.error('Failed to parse SSE payload', error);
				errorMessage = '갱신 데이터를 읽을 수 없습니다.';
			}
		};

		eventSource.onerror = () => {
			connectionStatus = 'error';
			errorMessage = '서버 연결이 끊겼습니다. 자동으로 재연결을 시도합니다.';
		};

		return () => eventSource.close();
	});

	$: recentMessages = [...messages].slice(-4, -1).reverse();
</script>

<main class="layout">
	<section class="poster-frame">
		<span class="poster-label">메인 포스터</span>
		<p class="poster-text">{currentText || '메시지를 기다리는 중입니다.'}</p>
		<p class="status">
			연결 상태:
			{connectionStatus === 'open'
				? '연결됨'
				: connectionStatus === 'connecting'
					? '연결 중'
					: '오류'}
		</p>
		{#if errorMessage}
			<p class="error">{errorMessage}</p>
		{/if}
	</section>

	<section class="info-grid">
		<div class="show-details">
			<p class="title">{currentText || '공연 제목이 준비 중입니다.'}</p>
			<div style="display: flex; with: 100%; justify-content: space-between;">
				<p class="organization">조직</p>
				<p class="time">2025.11.26 12:00</p>
			</div>
			<p class="description">
				{currentText
					? `${currentText} 공연의 자세한 설명이 여기에 표시됩니다.`
					: '공연 설명은 아직 입력되지 않았습니다.'}
			</p>
		</div>
		<hr style="width: 100%;" />
		<div class="history-row">
			{#each recentMessages as message}
				<div class="history-card">
					<p>{message}</p>
				</div>
			{/each}
		</div>
		<hr style="width: 100%;" />
		<div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
			<div style="display: flex; flex-direction: column; gap: 0.25rem;">
				<p style="margin: 0">이메일(scspace@kaist.ac.kr)로 문의 바랍니다.</p>
				<p style="margin: 0">Please contact us via scspace@kaist.ac.kr.</p>
			</div>
			<div style="display: flex; align-items: center; gap: 1rem;">
				<div style="display: flex; flex-direction: column; gap: 0.25rem; align-items: end;">
					<p style="margin: 0">학생문화공간위원회</p>
					<p style="margin: 0">Student Culture & Space Committee</p>
				</div>
				<img src="/logo.svg" alt="Logo" height="60" />
			</div>
		</div>
	</section>

	<div class="updated-timestamp">
		Last Updated: {lastUpdated}
	</div>
</main>

<style>
	:global(body) {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background: #ffffff;
		color: #000000;
		margin: 0;
		padding: 0;
	}

	.layout {
		height: 100dvh;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 2rem;
		padding: 2rem 3rem;
		box-sizing: border-box;
	}

	.poster-frame {
		height: 100%;
		aspect-ratio: 210 / 297;
		border-radius: 0.5rem;
		border: 1px solid rgba(0, 0, 0, 0.25);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.poster-label {
		font-size: 1rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.poster-text {
		font-size: clamp(1.5rem, 3vw, 2.75rem);
		font-weight: 600;
		margin: 0;
		line-height: 1.4;
	}

	.info-grid {
		display: grid;
		grid-template-rows: 3fr auto 1fr auto auto;
		gap: 0.5rem;
		height: 100%;
		width: 100%;
	}

	.show-details {
		padding: 2rem;
		display: flex;
		flex-direction: column;
	}

	.show-details .title {
		font-size: 3rem;
		width: 100%;
		text-align: center;
		font-weight: 800;
	}

	.show-details .organization {
		font-size: 2rem;
		font-weight: 600;
	}

	.show-details .time {
		font-size: 2rem;
		font-weight: 600;
	}

	.show-details .description {
		font-size: 1.25rem;
		line-height: 1.6;
		flex-grow: 1;
	}

	.history-row {
		width: 100%;
		display: flex;
		gap: 0.5rem;
		justify-content: space-around;
	}

	.history-card {
		height: 100%;
		aspect-ratio: 210 / 297;
		border-radius: 0.3rem;
		border: 1px solid rgba(0, 0, 0, 0.25);
		background: rgba(255, 255, 255, 0.03);
		flex-direction: column;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.history-card p {
		margin: 0;
		font-size: 0.95rem;
	}

	.updated-timestamp {
		position: absolute;
		top: 1rem;
		right: 1rem;
		font-size: 0.875rem;
		color: #666666;
	}
</style>
