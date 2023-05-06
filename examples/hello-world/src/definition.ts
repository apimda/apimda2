import { a } from '@apimda/core';
import { z } from 'zod';

export const helloController = a.controller().define({
  hello: a.op
    .get('/hello')
    .input({
      message: a.in.query(z.string().min(3).optional())
    })
    .output(a.out.text())
    .build()
});
