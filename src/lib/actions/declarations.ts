'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getDeclarations() {
  return await prisma.declaration.findMany({
    orderBy: { title: 'asc' }
  })
}

export async function createDeclaration(data: any) {
  const dec = await prisma.declaration.create({
    data: {
      title: data.title,
      body: data.body
    }
  })
  revalidatePath('/', 'layout')
  return dec
}

export async function updateDeclaration(id: number, data: any) {
  const dec = await prisma.declaration.update({
    where: { id },
    data: {
      title: data.title,
      body: data.body
    }
  })
  revalidatePath('/', 'layout')
  return dec
}

export async function deleteDeclaration(id: number) {
  await prisma.declaration.delete({
    where: { id }
  })
  revalidatePath('/', 'layout')
}
