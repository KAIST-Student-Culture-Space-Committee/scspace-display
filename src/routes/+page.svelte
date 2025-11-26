<script lang="ts">
	import { onMount } from 'svelte';
	import { HISTORY_LIMIT } from '../static/const';

	let currentText = '';
	let messages: string[] = [];
	let draftText = '';
	let connectionStatus: 'connecting' | 'open' | 'error' = 'connecting';
	let isSubmitting = false;
	let errorMessage = '';

	onMount(() => {
		const eventSource = new EventSource('/api');

		eventSource.onopen = () => {
			connectionStatus = 'open';
			errorMessage = '';
		};

		eventSource.onmessage = (event) => {
			const next = event.data;
			messages = [...messages.slice(-(HISTORY_LIMIT - 1)), next];
			currentText = next;
		};

		eventSource.onerror = () => {
			connectionStatus = 'error';
			errorMessage = '서버 연결이 끊겼습니다. 자동으로 재연결을 시도합니다.';
		};

		return () => eventSource.close();
	});

	async function updateText() {
		if (!draftText.trim()) {
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			const query = new URLSearchParams({ text: draftText });
			const response = await fetch(`/api?${query.toString()}`);

			if (!response.ok) {
				throw new Error('텍스트 전송에 실패했습니다.');
			}

			draftText = '';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<main class="container">
	<section class="panel">
		<h1>실시간 메시지</h1>
		<p class="label">서버에서 받은 텍스트</p>
		<p class="value">{currentText || '아직 수신된 메시지가 없습니다.'}</p>
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

	<section class="panel">
		<h2>새 텍스트 전송 (GET: /api?text=...)</h2>
		<form class="form" on:submit|preventDefault={updateText}>
			<input type="text" placeholder="전송할 텍스트를 입력하세요" bind:value={draftText} />
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? '전송 중...' : '전송'}
			</button>
		</form>
	</section>

	<section class="panel history">
		<h2>히스토리</h2>
		{#if messages.length === 0}
			<p class="history-empty">아직 기록이 없습니다.</p>
		{:else}
			<ol class="history-list">
				{#each [...messages].reverse() as message, index}
					<li class="history-item">
						<span class="badge">{messages.length - index}</span>
						<span>{message}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background: #10131a;
		color: #f2f3f5;
	}

	.container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 2rem;
		max-width: 720px;
		margin: 0 auto;
	}

	.panel {
		background: rgba(255, 255, 255, 0.04);
		.history-list {
			list-style: none;
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		.history-item {
			display: flex;
			gap: 0.75rem;
			align-items: flex-start;
			padding: 0.5rem 0.75rem;
			border-radius: 0.75rem;
			background: rgba(255, 255, 255, 0.02);
		}

		.badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 1.5rem;
			height: 1.5rem;
			border-radius: 999px;
			font-size: 0.8rem;
			background: rgba(75, 139, 255, 0.2);
			color: #9dbdff;
		}

		.history-empty {
			margin: 0;
			color: #8f9ba8;
		}
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
	}

	h1,
	h2 {
		margin: 0 0 0.5rem;
		font-weight: 600;
	}

	.label {
		margin: 0;
		color: #8f9ba8;
		font-size: 0.9rem;
	}

	.value {
		font-size: 1.5rem;
		margin: 0.5rem 0 1rem;
		word-break: break-word;
	}

	.status {
		margin: 0;
		color: #8f9ba8;
		font-size: 0.9rem;
	}

	.error {
		margin-top: 0.5rem;
		color: #ff6b6b;
		font-size: 0.9rem;
	}

	.form {
		display: flex;
		gap: 0.75rem;
	}

	input {
		flex: 1;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
		color: inherit;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #4b8bff;
		box-shadow: 0 0 0 2px rgba(75, 139, 255, 0.2);
	}

	button {
		padding: 0 1.5rem;
		border-radius: 0.75rem;
		border: none;
		background: linear-gradient(120deg, #4b8bff, #8559ff);
		color: #fff;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.form {
			flex-direction: column;
		}

		button {
			width: 100%;
			padding: 0.75rem;
		}
	}
</style>
