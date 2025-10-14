import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

function pad(n: number, width = 5) {
  const s = String(n);
  return s.length >= width ? s : new Array(width - s.length + 1).join("0") + s;
}

async function generateUniqueMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const seq = Math.floor(Math.random() * 99999);
    const candidate = `HRD-${year}-${pad(seq)}`;
    const exists = await prisma.membership.findUnique({ where: { memberId: candidate } });
    if (!exists) return candidate;
  }
  return `HRD-${year}-${Date.now().toString().slice(-5)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const rawEmail = String(body?.email || "").trim().toLowerCase();
    const phone = String(body?.mobile || body?.phone || "").trim();
    const address = String(body?.address || "").trim();
    const dob = String(body?.dob || body?.dateOfBirth || "").trim();
    const photoUrl = String(body?.photoUrl || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Upsert user by email (and optionally phone)
    const pwd = await hashPassword(Math.random().toString(36).slice(2) + Date.now());

    const emailRegex = /.+@.+\..+/;
    const validEmail = emailRegex.test(rawEmail) ? rawEmail : "";
    const phoneDigits = phone.replace(/\D+/g, "");
    const synthesizedEmail = validEmail || (phoneDigits ? `${phoneDigits}@anon.hrd.local` : `anon-${Date.now()}-${Math.random().toString(36).slice(2,8)}@anon.hrd.local`);

    let user = validEmail ? await prisma.user.findUnique({ where: { email: validEmail } }) : null;
    if (!user && phoneDigits) {
      user = await prisma.user.findFirst({ where: { phone: phoneDigits } });
    }

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            name,
            email: synthesizedEmail,
            phone: phoneDigits || null,
            photoUrl: photoUrl || null,
            passwordHash: pwd,
          },
        });
      } catch (e: any) {
        // Handle unique phone conflict by retrying without phone
        if (String(e?.message || "").includes("Unique constraint failed") && phone) {
          user = await prisma.user.create({
            data: {
              name,
              email: synthesizedEmail,
              phone: null,
              photoUrl: photoUrl || null,
              passwordHash: pwd,
            },
          });
        } else {
          throw e;
        }
      }
    } else {
      // Update basic fields if changed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          phone: phoneDigits || user.phone,
          photoUrl: photoUrl || user.photoUrl,
        },
      });
    }

    // Ensure membership exists for this user
    let membership = await prisma.membership.findUnique({ where: { userId: user.id } }).catch(async () => {
      return prisma.membership.findFirst({ where: { userId: user.id } });
    });
    if (!membership) {
      const memberId = await generateUniqueMemberId();
      membership = await prisma.membership.create({
        data: {
          userId: user.id,
          memberId,
          issuedAt: new Date(),
          details: { address, dob },
          photoUrl: photoUrl || null,
        },
      });
    }

    return NextResponse.json({ membership }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create membership" }, { status: 500 });
  }
}
