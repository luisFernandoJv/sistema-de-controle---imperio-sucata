import React from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { Save, Bell, Database } from 'lucide-react';
    
    export default function SettingsPage() {
        const { toast } = useToast();
    
        const handleSubmit = (e) => {
            e.preventDefault();
            toast({
                title: "Configurações salvas!",
                description: "Suas alterações foram salvas com sucesso (simulação).",
            });
        };
    
        const handleDbMigration = () => {
             toast({
                title: "Migração de Banco de Dados",
                description: "🚧 Este recurso ainda não foi implementado. Podemos configurar o Supabase para você no próximo passo!",
                duration: 9000,
            });
        }
    
        return (
            <>
                <Helmet>
                    <title>Configurações - ReciclaSys</title>
                    <meta name="description" content="Ajuste as configurações do sistema." />
                </Helmet>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
    
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Empresa</CardTitle>
                            <CardDescription>Atualize os dados do seu negócio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="company-name">Nome da Empresa</Label>
                                    <Input id="company-name" defaultValue="ReciclaSys Ltda." />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact-email">Email de Contato</Label>
                                    <Input id="contact-email" type="email" defaultValue="contato@reciclasys.com" />
                                </div>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Database className="mr-2 h-5 w-5" />
                                Banco de Dados
                            </CardTitle>
                            <CardDescription>
                                Atualmente, seus dados estão salvos localmente. Para maior segurança e acesso de qualquer lugar, recomendamos migrar para um banco de dados na nuvem.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground mb-4">
                                Usar um serviço como o Supabase garante que seus dados não sejam perdidos e permite futuras expansões do sistema.
                           </p>
                           <Button onClick={handleDbMigration} variant="secondary">
                                Iniciar Migração para Supabase
                           </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </>
        );
    }
