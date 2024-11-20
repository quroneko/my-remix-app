import type { MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'My Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-5">Welcome to Remix!</h1>

      <ul className="list-disc list-inside">
        <li>
          <a href="/users" className="text-blue-500 underline">Users</a>
        </li>
      </ul>
    </div>
  );
}
