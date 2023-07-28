import { z } from 'zod';

import { getAuthSession } from '@/configs/auth.config';
import { db } from '@/lib/db';
import { SubredditSubscriptionValidator } from '@/lib/validators/subreddit.validator';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response('unauthorized', {
        status: 401,
      });
    }

    const body = await req.json();

    const { subredditId } = SubredditSubscriptionValidator.parse(body);

    const subscriptionExists = await db.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    });

    if (subscriptionExists) {
      return new Response('you are already subscribed to this subreddit', {
        status: 400,
      });
    }

    await db.subscription.create({
      data: {
        subredditId,
        userId: session.user.id,
      },
    });

    return new Response(subredditId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response('invalid request data passed', {
        status: 422,
      });
    }

    return new Response('could not subscribe', {
      status: 500,
    });
  }
}
