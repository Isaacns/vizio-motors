/* ============================================================
   Vizio Motors — dados de demonstração
   No go-live, este arquivo é substituído/alimentado pelo backend
   (Supabase). Aqui é apenas a semente para a sessão de demo.
   ============================================================ */
const STATUS_FLOW = [
  "Recebido","Diagnóstico","Aguardando aprovação","Peças em separação",
  "Em manutenção","Testes","Lavagem","Finalizado","Pronto para retirada"
];

const DADOS = {
  _cfg:{ produto:"Vizio Motors", oficina:"Oficina Demonstração",
         especialidade:"Multimarcas", perfil:"admin" },

  servicos:[
    {id:"S1", nome:"Troca de óleo + filtros", preco:320, tempoMin:40, categoria:"Revisão"},
    {id:"S2", nome:"Revisão 40.000 km", preco:890, tempoMin:150, categoria:"Revisão"},
    {id:"S3", nome:"Revisão 60.000 km", preco:1240, tempoMin:210, categoria:"Revisão"},
    {id:"S4", nome:"Troca de embreagem", preco:2600, tempoMin:480, categoria:"Motor/Transmissão"},
    {id:"S5", nome:"Diagnóstico eletrônico", preco:180, tempoMin:60, categoria:"Injeção"},
    {id:"S6", nome:"Suspensão dianteira", preco:1180, tempoMin:240, categoria:"Suspensão"},
    {id:"S7", nome:"Freios (pastilhas + discos)", preco:940, tempoMin:150, categoria:"Freios"},
    {id:"S8", nome:"Ar-condicionado (higienização + carga)", preco:390, tempoMin:90, categoria:"Ar-condicionado"}
  ],
  pecas:[
    {id:"P1", nome:"Kit de embreagem", custo:1150, preco:1720, estoque:2, minimo:3, fornecedor:"AutoParts"},
    {id:"P2", nome:"Óleo 5W30 (litro)", custo:32, preco:58, estoque:40, minimo:20, fornecedor:"LubMax"},
    {id:"P3", nome:"Filtro de óleo", custo:28, preco:62, estoque:14, minimo:8, fornecedor:"AutoParts"},
    {id:"P4", nome:"Filtro de combustível", custo:45, preco:98, estoque:5, minimo:6, fornecedor:"DieselParts"},
    {id:"P5", nome:"Pastilha de freio dianteira", custo:120, preco:240, estoque:9, minimo:6, fornecedor:"FrenaBR"},
    {id:"P6", nome:"Disco de freio (par)", custo:280, preco:470, estoque:3, minimo:4, fornecedor:"FrenaBR"},
    {id:"P7", nome:"Amortecedor dianteiro", custo:210, preco:360, estoque:6, minimo:4, fornecedor:"SuspTech"},
    {id:"P8", nome:"Gás R134a (kg)", custo:60, preco:130, estoque:8, minimo:4, fornecedor:"ClimaAuto"}
  ],
  clientes:[
    {id:"C1", nome:"Transportes Bahia Log", tel:"71 99888-1010", email:"frota@bahialog.com", nasc:"2015-03-12", obs:"Frota de 12 utilitários. Fecha OS por e-mail."},
    {id:"C2", nome:"João Pereira", tel:"71 99123-4567", email:"joao.p@gmail.com", nasc:"1984-07-22", obs:"Aceita revisão preventiva."},
    {id:"C3", nome:"Maria Santos", tel:"71 99777-2233", email:"maria.s@outlook.com", nasc:"1990-11-05", obs:""},
    {id:"C4", nome:"Delivery Express ME", tel:"71 99555-8080", email:"contato@deliveryexp.com", nasc:"2019-01-30", obs:"3 furgões utilitários."},
    {id:"C5", nome:"Carlos Menezes", tel:"71 99444-1200", email:"carlosm@gmail.com", nasc:"1978-09-18", obs:"Cliente desde 2020."}
  ],
  veiculos:[
    {id:"V1", clienteId:"C1", placa:"RJZ-1D23", modelo:"Volkswagen Saveiro 1.6", ano:2021, km:78400, cor:"Branco", combustivel:"Flex"},
    {id:"V2", clienteId:"C2", placa:"PQR-8H45", modelo:"Fiat Fiorino 1.4", ano:2019, km:59200, cor:"Prata", combustivel:"Flex"},
    {id:"V3", clienteId:"C3", placa:"ABC-2F10", modelo:"Chevrolet Onix 1.0 Turbo", ano:2020, km:41200, cor:"Branco", combustivel:"Flex"},
    {id:"V4", clienteId:"C4", placa:"MST-7K99", modelo:"Renault Master Minibus 16L", ano:2022, km:33150, cor:"Branco", combustivel:"Diesel"},
    {id:"V5", clienteId:"C5", placa:"GHT-3B77", modelo:"Toyota Corolla 2.0", ano:2018, km:96800, cor:"Cinza", combustivel:"Flex"},
    {id:"V6", clienteId:"C1", placa:"RJZ-4C88", modelo:"Fiat Toro 2.0 Diesel", ano:2021, km:71000, cor:"Prata", combustivel:"Diesel"}
  ],
  // statusIdx = índice em STATUS_FLOW
  os:[
    {id:"OS1", numero:1042, clienteId:"C1", veiculoId:"V1", entrada:"2026-07-03", previsao:"2026-07-04",
     responsavel:"Carlos (mecânico)", statusIdx:4, aprovado:true, token:"vm-1042",
     checklist:[{item:"Pneus",ok:true},{item:"Nível de óleo",ok:true},{item:"Freios",ok:true},{item:"Bateria",ok:false}],
     itens:[{tipo:"servico",refId:"S4",qtd:1,valor:2600},{tipo:"peca",refId:"P1",qtd:1,valor:1720}],
     obs:"Cliente relatou patinação da embreagem em subida."},
    {id:"OS2", numero:1043, clienteId:"C2", veiculoId:"V2", entrada:"2026-07-03", previsao:"2026-07-03",
     responsavel:"André (mecânico)", statusIdx:3, aprovado:true, token:"vm-1043",
     checklist:[{item:"Filtros",ok:true},{item:"Correia",ok:false},{item:"Fluidos",ok:true}],
     itens:[{tipo:"servico",refId:"S3",qtd:1,valor:1240},{tipo:"peca",refId:"P3",qtd:1,valor:62},{tipo:"peca",refId:"P2",qtd:8,valor:464}],
     obs:"Revisão de 60 mil km."},
    {id:"OS3", numero:1044, clienteId:"C3", veiculoId:"V3", entrada:"2026-07-03", previsao:"2026-07-04",
     responsavel:"André (mecânico)", statusIdx:1, aprovado:false, token:"vm-1044",
     checklist:[{item:"Scanner OBD",ok:true},{item:"Chicote",ok:false}],
     itens:[{tipo:"servico",refId:"S5",qtd:1,valor:180}],
     obs:"Luz de injeção acesa. Aguardando diagnóstico."},
    {id:"OS4", numero:1045, clienteId:"C4", veiculoId:"V4", entrada:"2026-07-02", previsao:"2026-07-03",
     responsavel:"Carlos (mecânico)", statusIdx:5, aprovado:true, token:"vm-1045",
     checklist:[{item:"Alinhamento",ok:true},{item:"Balanceamento",ok:true}],
     itens:[{tipo:"servico",refId:"S6",qtd:1,valor:1180},{tipo:"peca",refId:"P7",qtd:2,valor:720}],
     obs:"Barulho na suspensão dianteira."},
    {id:"OS5", numero:1046, clienteId:"C5", veiculoId:"V5", entrada:"2026-07-01", previsao:"2026-07-02",
     responsavel:"André (mecânico)", statusIdx:8, aprovado:true, token:"vm-1046",
     checklist:[{item:"Pastilhas",ok:true},{item:"Discos",ok:true},{item:"Fluido de freio",ok:true}],
     itens:[{tipo:"servico",refId:"S7",qtd:1,valor:940},{tipo:"peca",refId:"P5",qtd:1,valor:240},{tipo:"peca",refId:"P6",qtd:1,valor:470}],
     obs:"Troca completa de freios. Pronto para retirada."}
  ],
  agenda:[
    {id:"A1", data:"2026-07-04", hora:"08:00", clienteId:"C2", veiculoId:"V2", tipo:"Revisão", obs:"Revisão 60k"},
    {id:"A2", data:"2026-07-04", hora:"10:30", clienteId:"C5", veiculoId:"V5", tipo:"Retorno", obs:"Conferir freios"},
    {id:"A3", data:"2026-07-04", hora:"14:00", clienteId:"C3", veiculoId:"V3", tipo:"Diagnóstico", obs:"Elétrica"},
    {id:"A4", data:"2026-07-05", hora:"09:00", clienteId:"C4", veiculoId:"V4", tipo:"Revisão", obs:"Preventiva frota"}
  ]
};
