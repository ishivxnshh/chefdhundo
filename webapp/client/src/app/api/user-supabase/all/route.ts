import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/supabase/database'

export async function GET() {
	try {
		const result = await getAllUsers()

		if (!result.success) {
			return NextResponse.json(
				{
					success: false,
					error: result.error ?? 'Failed to fetch users',
				},
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			data: result.data ?? [],
		})
	} catch (error) {
		console.error('GET /api/user-supabase/all failed:', error)
		return NextResponse.json(
			{
				success: false,
				error: 'Internal server error',
			},
			{ status: 500 }
		)
	}
}
