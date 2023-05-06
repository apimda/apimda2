import { a } from '@apimda/core';
import { z } from 'zod';

export const testControllerDef = a.controller('/base').define({
  bodyArrayExample: a.op
    .post('/bodyArrayExample')
    .input({
      body: a.in.body(z.array(z.number()))
    })
    .output(a.out.schema(z.array(z.number())))
    .build(),

  bodyBinaryExample: a.op
    .post('/bodyBinaryExample')
    .input({
      body: a.in.bodyBinary()
    })
    .output(a.out.binary())
    .build(),

  bodyObjectExample: a.op
    .post('/bodyObjectExample')
    .input({
      body: a.in.body(z.object({ id: z.number() }))
    })
    .output(a.out.schema(z.object({ id: z.number() })))
    .build(),

  bodyTextExample: a.op
    .post('/bodyTextExample')
    .input({
      body: a.in.bodyText()
    })
    .output(a.out.text())
    .build(),

  cookieExample: a.op
    .get('/cookieExample')
    .input({
      bln: a.in.cookie(z.boolean()),
      str: a.in.cookie(z.string()),
      num: a.in.cookie(z.number()),
      obj: a.in.cookie(z.object({ id: z.number() }))
    })
    .output(
      a.out.schema(
        z.object({
          bln: z.boolean(),
          str: z.string(),
          num: z.number(),
          obj: z.object({ id: z.number() })
        })
      )
    )
    .build(),

  headerExample: a.op
    .get('/headerExample')
    .input({
      bln: a.in.header(z.boolean(), 'X-Bln-Header'),
      str: a.in.header(z.string(), 'X-Str-Header'),
      num: a.in.header(z.number(), 'X-Num-Header'),
      obj: a.in.header(z.object({ id: z.number() }), 'X-Obj-Header')
    })
    .output(
      a.out.schema(
        z.object({
          bln: z.boolean(),
          str: z.string(),
          num: z.number(),
          obj: z.object({ id: z.number() })
        })
      )
    )
    .build(),

  pathExample: a.op
    .get('/pathExample/{bln}/{str}/{num}')
    .input({
      bln: a.in.path(z.boolean()),
      str: a.in.path(z.string()),
      num: a.in.path(z.number())
    })
    .output(
      a.out.schema(
        z.object({
          bln: z.boolean(),
          str: z.string(),
          num: z.number()
        })
      )
    )
    .build(),

  queryExample: a.op
    .get('/queryExample')
    .input({
      bln: a.in.query(z.boolean()),
      str: a.in.query(z.string()),
      num: a.in.query(z.number()),
      obj: a.in.query(z.object({ id: z.number() })),
      optional: a.in.query(z.string().optional())
    })
    .output(
      a.out.schema(
        z.object({
          bln: z.boolean(),
          str: z.string(),
          num: z.number(),
          obj: z.object({ id: z.number() }),
          optional: z.string().optional()
        })
      )
    )
    .build()
});

export const testControllerImpl = a.implement(testControllerDef).as({
  bodyArrayExample: async input => input.body,
  bodyBinaryExample: async input => input.body,
  bodyObjectExample: async input => input.body,
  bodyTextExample: async input => input.body,
  cookieExample: async input => input,
  headerExample: async input => input,
  pathExample: async input => input,
  queryExample: async input => input
});
