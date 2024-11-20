import { useLoaderData } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { faker } from '@faker-js/faker';
import { type User, users as usersTable } from '~/db/schema';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const db = drizzle(context.cloudflare.env.DB);

  // insert a user
  const insertStart = performance.now();
  await db.insert(usersTable).values({
    name: faker.person.fullName(),
    age: faker.number.int({ min: 18, max: 65 }),
    email: faker.internet.email(),
  });
  const insertEnd = performance.now();
  const insertTime = insertEnd - insertStart;

  // select all users
  const selectStart = performance.now();
  const users = await db.select().from(usersTable).all();
  const selectEnd = performance.now();
  const selectTime = selectEnd - selectStart;

  const body = JSON.stringify({ users, insertTime, selectTime });

  return new Response(body, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>() as { users: User[], insertTime: number, selectTime: number };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Users</h1>
      <p>Insert Time: {data.insertTime.toFixed(2)} ms</p>
      <p>Select Time: {data.selectTime.toFixed(2)} ms</p>
      <table className="min-w-full bg-gray-50 rounded-xl overflow-hidden">
        <thead className="h-10">
          <tr className="text-left font-semibold bg-gray-100">
            <th className="px-5">ID</th>
            <th className="px-5">Name</th>
            <th className="px-5">Age</th>
            <th className="px-5">Email</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 h-10">
              <td className="px-5">{user.id}</td>
              <td className="px-5">{user.name}</td>
              <td className="px-5">{user.age}</td>
              <td className="px-5">{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
