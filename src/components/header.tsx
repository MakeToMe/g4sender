"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"
import { ModeToggle } from "@/components/mode-toggle"
import { LogOut } from "lucide-react"

export function Header() {
    return (
        <div className="flex items-center p-4 border-b">
            <div className="ml-auto flex items-center gap-x-4">
                <ModeToggle />
                <form action={async () => await signOut()}>
                    <Button variant="ghost" size="icon">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
