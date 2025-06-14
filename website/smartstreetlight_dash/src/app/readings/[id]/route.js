'use server'


import prisma from "@/lib/prisma";

// route handler for fetching all streetlight data


// for pi db 
export async function GET(request, { params }) {

  const { id } = await params;


  const data = await prisma.Streetlight.findUnique({
    where: {
      id: parseInt(id)
    },
    select: {
      readings: true
    }
  });
  return Response.json(data?.readings || []);
}


// for primsa postgres db
// export async function GET() {
//   const data = await prisma.LangaraData.findMany();
//   return Response.json(data);
// }
