import { useEffect, useState } from 'react';

export default function CountCard({ chinese = false }: { chinese?: boolean }) {
  const [count, setCount] = useState<{ visit: number; visitor: number } | null>(
    null,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/counters/docs/json-example', { method: 'POST' })
      .then(async response => {
        if (!response.ok) {
          throw new Error('Request failed');
        }
        setCount(await response.json());
      })
      .catch(() => setFailed(true));
  }, []);

  return (
    <p
      role="status"
      style={{
        padding: '20px 24px',
        borderRadius: 8,
        background: 'var(--docs-surface)',
      }}
    >
      {failed ? (
        chinese ? (
          '暂时无法获取计数。'
        ) : (
          'Unable to load the counter.'
        )
      ) : count ? (
        <>
          {chinese ? '访问次数' : 'Visits'}: {count.visit} ·{' '}
          {chinese ? '独立 IP' : 'Distinct IPs'}: {count.visitor}
        </>
      ) : chinese ? (
        '加载中……'
      ) : (
        'Loading…'
      )}
    </p>
  );
}
