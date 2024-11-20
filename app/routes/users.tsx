import { useLoaderData, Form, useActionData } from '@remix-run/react';
import type { MetaFunction, LoaderFunction, LoaderFunctionArgs, ActionFunction } from '@remix-run/cloudflare';
import { desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { faker } from '@faker-js/faker';
import { type User, users as usersTable } from '~/db/schema';

export const meta: MetaFunction = () => {
  return [
    { title: 'Users | My Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export const loader: LoaderFunction = async ({ context }: LoaderFunctionArgs) => {
  const db = drizzle(context.cloudflare.env.DB);

  // select all users
  const selectStart = performance.now();
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.timestamp)).all();
  const selectEnd = performance.now();
  const selectTime = selectEnd - selectStart;

  const body = JSON.stringify({ users, selectTime });

  return new Response(body, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const action: ActionFunction = async ({ context }: LoaderFunctionArgs) => {
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

  return new Response(JSON.stringify({ insertTime }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export default function Users() {
  const data = useLoaderData<typeof loader>() as { users: User[], selectTime: number };
  const actionData = useActionData<typeof action>() as { insertTime: number } | undefined;

  return (
    <div className="p-10 space-y-5">
      <h1 className="text-2xl font-bold">Users</h1>

      <div>
        <p>Select Time: {data.selectTime.toFixed(2)} ms</p>
      </div>

      <div>
        <Form method="post">
          <button type="submit" className="bg-black text-white px-2.5 py-1 rounded-full">
            Insert User
          </button>
        </Form>

        {actionData?.insertTime !== undefined && (
          <div>
            <p>Insert Time: {actionData.insertTime.toFixed(2)} ms</p>
          </div>
        )}
      </div>

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
