import MainLayout from "@/components/layout/main-layout";

export default function Home() {
    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Bienvenue, voici un resume de votre activite.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border bg-card p-6">
                        <p className="text-sm font-medium text-muted-foreground">Prospects chauds</p>
                        <p className="text-2xl font-bold mt-1">0</p>
                    </div>
                    <div className="rounded-lg border bg-card p-6">
                        <p className="text-sm font-medium text-muted-foreground">A relancer aujourd'hui</p>
                        <p className="text-2xl font-bold mt-1">0</p>
                    </div>
                    <div className="rounded-lg border bg-card p-6">
                        <p className="text-sm font-medium text-muted-foreground">CA signe</p>
                        <p className="text-2xl font-bold mt-1">0 €</p>
                    </div>
                    <div className="rounded-lg border bg-card p-6">
                        <p className="text-sm font-medium text-muted-foreground">Concerts a venir</p>
                        <p className="text-2xl font-bold mt-1">0</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}