import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

export function RecentActivity() {
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                    <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Campanha "Black Friday"</p>
                    <p className="text-sm text-muted-foreground">
                        Enviada para 1.200 contatos
                    </p>
                </div>
                <div className="ml-auto font-medium text-green-500">Concluída</div>
            </div>
            <div className="flex items-center">
                <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                    <AvatarImage src="/avatars/02.png" alt="Avatar" />
                    <AvatarFallback>JL</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Novo Contato</p>
                    <p className="text-sm text-muted-foreground">
                        João Lima (11) 99999-9999
                    </p>
                </div>
                <div className="ml-auto font-medium">+1</div>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/03.png" alt="Avatar" />
                    <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Instância Conectada</p>
                    <p className="text-sm text-muted-foreground">
                        Marketing WhatsApp 01
                    </p>
                </div>
                <div className="ml-auto font-medium text-blue-500">Online</div>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/04.png" alt="Avatar" />
                    <AvatarFallback>WK</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Campanha "Promoção Relâmpago"</p>
                    <p className="text-sm text-muted-foreground">
                        Agendada para amanhã às 10:00
                    </p>
                </div>
                <div className="ml-auto font-medium text-yellow-500">Agendada</div>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/05.png" alt="Avatar" />
                    <AvatarFallback>SD</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Mensagem Recebida</p>
                    <p className="text-sm text-muted-foreground">
                        Sofia: "Gostaria de saber mais..."
                    </p>
                </div>
                <div className="ml-auto font-medium">Agora</div>
            </div>
        </div>
    )
}
