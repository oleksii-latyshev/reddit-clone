import { z } from 'zod';

import { getAuthSession } from '@/configs/auth.config';
import { db } from '@/lib/db';
import { SubredditValidator } from '@/lib/validators/subreddit.validator';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response('unauthorized', {
        status: 401,
      });
    }

    const body = await req.json();
    const { name } = SubredditValidator.parse(body);

    const subredditExists = await db.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (subredditExists) {
      return new Response('subreddit already exists', {
        status: 409,
      });
    }

    const subreddit = await db.subreddit.create({
      data: {
        name,
        creatorId: session.user.id,
      },
    });

    await db.subscription.create({
      data: {
        userId: session.user.id,
        subredditId: subreddit.id,
      },
    });

    return new Response(subreddit.name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // если мы попали в этот блок, то эта ошибка связанна с тем, что данные не прошли валидацию
      return new Response(error.message, {
        status: 422,
      });
    }

    return new Response('could not create subreddit', {
      status: 500,
    });
  }
}
