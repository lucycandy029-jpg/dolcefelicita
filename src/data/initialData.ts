import { Product, Category, Address, Order, User } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'Todos', iconName: 'cake', count: 38 },
  { id: 'cookies', name: 'Cookies Artesanais', iconName: 'cookie', count: 12 },
  { id: 'brownies', name: 'Brownies & Fudges', iconName: 'bakery_dining', count: 8 },
  { id: 'bolos-tortas', name: 'Bolos & Tortas', iconName: 'cake', count: 9 },
  { id: 'doces-finos', name: 'Doces Finos & Bombons', iconName: 'lunch_dining', count: 6 },
  { id: 'bebidas-cafes', name: 'Bebidas & Cafés', iconName: 'coffee', count: 3 }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-cookie-nutella',
    categoryId: 'cookies',
    name: 'Cookie Tortinha de Nutella',
    slug: 'cookie-tortinha-de-nutella',
    shortDescription: 'Bordas crocantes, centro cremoso recheado com Nutella pura e avelãs tostadas selecionadas.',
    description: 'Cookie artesanal dourado com bordas crocantes e centro fofo, generosamente recheado com Nutella pura e finalizado com avelãs crocantes selecionadas.',
    price: 16.00,
    unitLabel: 'Unidade 130g',
    weightGrams: 130,
    badgeTag: 'Fornada do Dia',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 480,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI9Q2Q983DUN78ApFjsf6giUl5bNQw43hicPMNuQdfluHfpxDWQnPMwyexvuvkGoMti9NDD_gC8YvkEi_VgvHyTi7gkcta7R7V7yNP-WFjTOBRBqSprkpCCh0amzAIONLS0SawvXJWEXo1-8vKn0rJ6MMVwtj29R7ugGXBHgyfNzUOH7PzIy5XagYcXz0XUN7Gpt4s1wfUfOpiRYJZGxAM9E2yyubWUWv_QpNYA_oOx9u0tGvSpYf9Iw',
    stockAvailable: 35,
    addons: [
      {
        id: 'addon-calda-nutella',
        name: 'Calda extra de Nutella morna',
        description: 'Pote separado 30ml para regar',
        price: 4.50,
        checked: true
      },
      {
        id: 'addon-ninho',
        name: 'Cobertura de Leite Ninho',
        description: 'Generosamente polvilhado no topo',
        price: 3.00,
        checked: false
      },
      {
        id: 'addon-presente',
        name: 'Embalagem para Presente',
        description: 'Caixa rígida com fita de cetim rosa',
        price: 5.00,
        checked: false
      },
      {
        id: 'addon-cartao-afetivo',
        name: 'Toque de Ninho & Mensagem Afetiva',
        description: 'Mini cartão caligrafado à mão',
        price: 3.00,
        checked: true
      }
    ]
  },
  {
    id: 'prod-cookie-pistache',
    categoryId: 'cookies',
    name: 'Cookie Pistache & Chocolate Branco',
    slug: 'cookie-pistache-chocolate-branco',
    shortDescription: 'Massa perfumada de pistache natural de Bronte, gotas de chocolate belga branco e flor de sal.',
    description: 'Massa especial com pistache de Bronte selecionado, chocolate belga branco Callebaut cremoso e flor de sal.',
    price: 18.50,
    unitLabel: 'Unidade 120g',
    weightGrams: 120,
    badgeTag: 'Edição Limitada',
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 120,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsqumJSa2Vni1uc1DMkqjBTHipMbIMwQLpNekxoTQldB77pVSnNLPV-rVVaOMhx5FnpwmxYSrXEHVLp-BeL84CQ8OUmY5H2VxDRL9XLBsLGQjhSnyOHxb2mlVz_QuJERan6u8fnqBhb5MjEEjFOEL0y1odcawp7wVu3gfAwp0_qE4p22dA7TDrxq_eUydB0pODiOhluOK5HO7kp92O5vBhVyvcBJQSx8Xm_mY2jEAoMBSV7DI6pWePsA',
    stockAvailable: 22,
    addons: [
      {
        id: 'addon-praline-pistache',
        name: 'Praliné extra de pistache',
        description: 'Pistache caramelizado crocante',
        price: 5.50
      },
      {
        id: 'addon-presente',
        name: 'Embalagem para Presente',
        description: 'Caixa rígida com fita de cetim rosa',
        price: 5.00
      }
    ]
  },
  {
    id: 'prod-cookie-redvelvet',
    categoryId: 'cookies',
    name: 'Cookie Red Velvet Melt',
    slug: 'cookie-red-velvet-melt',
    shortDescription: 'Massa vermelha aveludada com cacau suave e recheio cremoso e azedinho de cream cheese original.',
    description: 'Massa vermelha aveludada com cacau suave e recheio cremoso e azedinho de cream cheese original.',
    price: 17.00,
    unitLabel: 'Unidade 120g',
    weightGrams: 120,
    badgeTag: 'Novo',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewCount: 89,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSYv2MAFkg1lkYyQwN5FU_KqxmKgE2p7p7KBogHGErHFY6NJJsHWb0fvCBiI9vXPu2sH0pHhetFNBIUI2reu05lwqIaJ4bvhAbxbBCnU-JZrtE5BgIxgFG8NZ9Jl2y27oAQRw7Q67R0QUtv4OcKwf8sCGT2rFxbhW2dftpT2zPeNbr5MJdhsePtcTh4UDTWtUvue_QrjqTfjay2IBQzhH-VkKqKUQPGxWjpyk3DhOlWUndxHYRpf2pfA',
    stockAvailable: 26,
    addons: [
      {
        id: 'addon-extra-frosting',
        name: 'Frosting extra de Cream Cheese',
        description: 'Pote 30g separado',
        price: 4.00
      },
      {
        id: 'addon-presente',
        name: 'Embalagem para Presente',
        description: 'Caixa rígida com fita de cetim rosa',
        price: 5.00
      }
    ]
  },
  {
    id: 'prod-cookie-triplo-chocolate',
    categoryId: 'cookies',
    name: 'Cookie Triplo Chocolate Belga',
    slug: 'cookie-triplo-chocolate-belga',
    shortDescription: 'Três variações de puro chocolate Callebaut: meio amargo 70%, ao leite suave e raspas de chocolate branco.',
    description: 'Três variações de puro chocolate Callebaut: meio amargo 70%, ao leite suave e raspas de chocolate branco.',
    price: 15.50,
    unitLabel: 'Unidade 120g',
    weightGrams: 120,
    badgeTag: 'Cacau 70%',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 310,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqHvKDPsEqQAIKcBSAvfDtdR_VUiurSwD55GuZFQuCedRm88_XDYYyyaEb9H-_phN0Wdig1myiTPg1azhgXGrhfigUaO1J2NGY0itmtmSzaBsGwfDU8UBqws3BR-f62fum7xm52buAk99lk9Xf7l9iUFnFGP552eD11IkFQfokBL4Is0S5syrxLE5E1M4psSYBYwig2mCfYuVOXi9FOjKgIhIUJLwxpNPQAukp8cxnBrUzP2aN6itQ6A',
    stockAvailable: 42,
    addons: [
      {
        id: 'addon-calda-brigadeiro',
        name: 'Calda de Brigadeiro Belga',
        description: 'Pote separado 30ml',
        price: 4.50
      }
    ]
  },
  {
    id: 'prod-brownie-caramelo',
    categoryId: 'brownies',
    name: 'Brownie Fudge Caramelo',
    slug: 'brownie-fudge-caramelo',
    shortDescription: 'Brownie denso com swirl de caramelo salgado e flor de sal.',
    description: 'Fatia densa de brownie fudge 70% cacau com calda toffee de caramelo com manteiga da serra e cristais de flor de sal.',
    price: 14.00,
    unitLabel: 'Fatia 150g',
    weightGrams: 150,
    badgeTag: 'Caramelo Flor de Sal',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 140,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6mO69ISAt0b0uufvBMXKkw0Qs-B02I-wIC_aOv7AHGFJDchqcsJ100Jr0dV0bXByjtCU-m6EXFTD5x1v6FmYRUNv-wnuUqU7qD1LahVgB0Dv5Zdzh1ZtVNeGwHdUK70R29yhJK2oNqGD47yi7vEiy9ibNSnedzrHnK39Mj0tRYnbto3SPNkFmDIG83B-xglNUXh3Td2HOzPSDJqpoGW0Gll0NSVqfe4FPskvir0rWJFjZUFJZdfOwZA',
    stockAvailable: 20
  },
  {
    id: 'prod-brownie-vulcao',
    categoryId: 'brownies',
    name: 'Brownie Vulcão Brigadeiro',
    slug: 'brownie-vulcao-brigadeiro',
    shortDescription: 'Brownie macio e denso com erupção generosa de brigadeiro tradicional de colher.',
    description: 'Brownie macio e denso com erupção generosa de brigadeiro tradicional de colher e granulados nobres.',
    price: 15.00,
    unitLabel: 'Fatia 160g',
    weightGrams: 160,
    badgeTag: 'Super Recheado',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewCount: 285,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd_4s4R7pCkqY-8cSuNNNIV18E7ixpraBrFQP28964Pw9HdeZeUaSaWQq6ZYJWSVXDxQa4-U_EgsokM-9Hx9MzHBxZ7IdihhQzKiP-_MkiEFpJ8NZrKyzirjtNlyM0F02vFRDYLxDkg5fJVByOtTO-8Ecdvi6NAWarrpJFIwLmBdRoULSIwDffjKFuFhUJ4KbsgxMTxHMlSP79XnaTkkaLVo775t1tCp5t7nMi-ujDfwCWEpOzejs0SA',
    stockAvailable: 24
  },
  {
    id: 'prod-brownie-morango',
    categoryId: 'brownies',
    name: 'Brownie Supremo Nutella & Morango',
    slug: 'brownie-supremo-nutella-morango',
    shortDescription: 'Brownie denso de cacau 70%, farta cobertura de Nutella e morangos frescos selecionados.',
    description: 'Brownie denso de cacau 70%, farta cobertura de Nutella e morangos frescos selecionados.',
    price: 22.00,
    unitLabel: 'Fatia Gourmet 180g',
    weightGrams: 180,
    badgeTag: 'Top #1 Vendas',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewCount: 518,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBs1caCTh-nlqHXNCodqC0YrOJFbVT_rFjOiVqApJTV0LMyLR5nCHTNnesHoVQn6yovH4Gyg_0kXUgpSpmBkcWWLnoEn-RCF1TTZxUintBRTYi79e44NM9jJvqiIBC5vgGOg_UUrsXFCNEo5Q9QPVTWLWrG2n5v-g4njg382GNCP-bRShRpgNP8GiBGLg6DLtGhgj2_Kt78_w9GZh2Z5fTbOrLvg3zL89kLPn-Ui-q53AS_YH98XnWHIQ',
    stockAvailable: 18
  },
  {
    id: 'prod-bolo-pote-pistache',
    categoryId: 'bolos-tortas',
    name: 'Bolo no Pote Pistache & Framboesa',
    slug: 'bolo-no-pote-pistache-framboesa',
    shortDescription: 'Pão de ló levinho, brigadeiro aveludado de pistache artesanal e geleia pura de framboesa.',
    description: 'Pão de ló levinho, brigadeiro aveludado de pistache artesanal e geleia pura de framboesa.',
    price: 24.00,
    unitLabel: 'Pote Vidro 220g',
    weightGrams: 220,
    badgeTag: 'Pistache Puro',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 120,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1iALC4oxNaCMbHU18YP6V4g5X6IJ02JOwu392DSjOoo9R8xMFMlaeYEidkdu0YLfBvxEfKYY17QpdMHST-0RP8zPkPbcHVbI_Kxw2tbzNRS4i-yFw2qwsqZIoxridZEgXJknOsCde4cViVRTjHDgdIuYF6WRezHshoA_ZjNRjk-OFeQ7CsYSi2uPvRwdLSXa6aiyKR1yYTLVomHlSBfW5wgDwGBMqS7XryMeEMJ2Mc1rpSk1msfimeQ',
    stockAvailable: 15
  }
];

export const DEFAULT_ADDRESS: Address = {
  id: 'addr-default-1',
  title: 'Casa',
  postalCode: '01310-100',
  street: 'Av. Paulista',
  number: '1000',
  complement: 'Apto 82',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  referencePoint: 'Próximo ao metrô Trianon-MASP • Portaria 24h',
  isDefault: true
};

export const INITIAL_USER: User = {
  id: 'usr-mariana-01',
  name: 'Mariana Vasconcellos',
  email: 'mariana.vasconcellos@exemplo.com',
  phone: '(11) 98765-4321',
  role: 'customer',
  createdAt: '2024-01-15T10:00:00Z'
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-4829',
    orderNumber: 4829,
    customerName: 'Mariana Vasconcellos',
    customerEmail: 'mariana.vasconcellos@exemplo.com',
    customerPhone: '(11) 98765-4321',
    status: 'preparing',
    items: [
      {
        id: 'item-1',
        productId: 'prod-cookie-nutella',
        name: 'Cookie Tortinha de Nutella',
        unitLabel: 'Unidade 130g',
        unitPrice: 16.00,
        quantity: 1,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI9Q2Q983DUN78ApFjsf6giUl5bNQw43hicPMNuQdfluHfpxDWQnPMwyexvuvkGoMti9NDD_gC8YvkEi_VgvHyTi7gkcta7R7V7yNP-WFjTOBRBqSprkpCCh0amzAIONLS0SawvXJWEXo1-8vKn0rJ6MMVwtj29R7ugGXBHgyfNzUOH7PzIy5XagYcXz0XUN7Gpt4s1wfUfOpiRYJZGxAM9E2yyubWUWv_QpNYA_oOx9u0tGvSpYf9Iw',
        badgeTag: 'Receita Artesanal',
        addons: [
          { id: 'a1', name: 'Calda extra de Nutella', price: 4.50 }
        ],
        itemTotal: 20.50
      },
      {
        id: 'item-2',
        productId: 'prod-brownie-morango',
        name: 'Brownie Supremo com Morangos',
        unitLabel: 'Fatia Gourmet 180g',
        unitPrice: 22.00,
        quantity: 1,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBs1caCTh-nlqHXNCodqC0YrOJFbVT_rFjOiVqApJTV0LMyLR5nCHTNnesHoVQn6yovH4Gyg_0kXUgpSpmBkcWWLnoEn-RCF1TTZxUintBRTYi79e44NM9jJvqiIBC5vgGOg_UUrsXFCNEo5Q9QPVTWLWrG2n5v-g4njg382GNCP-bRShRpgNP8GiBGLg6DLtGhgj2_Kt78_w9GZh2Z5fTbOrLvg3zL89kLPn-Ui-q53AS_YH98XnWHIQ',
        badgeTag: 'Cacau Belga 70%',
        addons: [],
        itemTotal: 22.00
      }
    ],
    subtotal: 42.50,
    deliveryFee: 7.50,
    discount: 7.25, // R$ 5,00 (cupom) + R$ 2,25 (PIX 5%)
    total: 42.75,
    paymentMethod: 'pix',
    paymentStatus: 'approved',
    address: DEFAULT_ADDRESS,
    courier: {
      name: 'Mateus Siqueira',
      phone: '(11) 98765-4321',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w',
      rating: 4.97,
      deliveriesCount: 850
    },
    notes: 'Por favor tocar o interfone 82 e deixar na portaria caso não atenda de imediato. Obrigado!',
    includeEcoUtensils: true,
    estimatedDeliveryTime: 'Hoje: 16:35 – 16:50 (Aprox. 35 minutos)',
    createdAt: 'Hoje às 16:05',
    updatedAt: 'Hoje às 16:10'
  },
  {
    id: 'ord-4102',
    orderNumber: 4102,
    customerName: 'Mariana Vasconcellos',
    customerEmail: 'mariana.vasconcellos@exemplo.com',
    status: 'delivered',
    items: [],
    subtotal: 58.00,
    deliveryFee: 0.00,
    discount: 0.00,
    total: 58.00,
    paymentMethod: 'pix',
    paymentStatus: 'approved',
    address: DEFAULT_ADDRESS,
    includeEcoUtensils: true,
    estimatedDeliveryTime: 'Entregue com sucesso',
    notes: 'Caixa Degustação 6 Docinhos Gourmet + 1 Cookie Red Velvet',
    createdAt: '14 de Março, 2024',
    updatedAt: '14 de Março, 2024'
  },
  {
    id: 'ord-3980',
    orderNumber: 3980,
    customerName: 'Mariana Vasconcellos',
    customerEmail: 'mariana.vasconcellos@exemplo.com',
    status: 'delivered',
    items: [],
    subtotal: 26.00,
    deliveryFee: 0.00,
    discount: 0.00,
    total: 26.00,
    paymentMethod: 'credit',
    paymentStatus: 'approved',
    address: DEFAULT_ADDRESS,
    includeEcoUtensils: true,
    estimatedDeliveryTime: 'Entregue com sucesso',
    notes: 'Torta Gelada de Pistache Artesanal (Fatia G)',
    createdAt: '28 de Fevereiro, 2024',
    updatedAt: '28 de Fevereiro, 2024'
  }
];

export const DEFAULT_STORE_SETTINGS = {
  storeName: 'Felicitá Doces e Cookies',
  slogan: 'Um pedacinho de felicidade em cada mordida.',
  cnpj: '12.345.678/0001-99',
  phone: '(11) 98765-4321',
  whatsapp: '5511987654321',
  instagram: '@felicitadoces',
  address: '',
  openingHours: 'Terça a Domingo: 11h às 22h',
  closedDays: 'Segundas-feiras',
  baseDeliveryFee: 7.50,
  freeShippingThreshold: 50.00,
  pixKey: '12345678000199',
  pixKeyType: 'CNPJ',
  pixBeneficiaryName: 'Dolce Felicitá Confeitaria Ltda',
  pixQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020126580014BR.GOV.BCB.PIX011412345678000199520400005303986540542.755802BR5925Dolce%20Felicita%20Doces6009Sao%20Paulo62070503***6304E2CA',
  pixDiscountPercent: 5.0
};

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Mariana Vasconcellos',
    email: 'mariana.vasconcellos@exemplo.com',
    phone: '(11) 98765-4321',
    city: 'São Paulo - Jardins',
    ordersCount: 5,
    totalSpent: 169.25,
    isActive: true,
    createdAt: '15/01/2024'
  },
  {
    id: 'cust-2',
    name: 'Carlos Eduardo Pinheiro',
    email: 'carlos.eduardo@exemplo.com',
    phone: '(11) 97654-3210',
    city: 'São Paulo - Pinheiros',
    ordersCount: 3,
    totalSpent: 112.50,
    isActive: true,
    createdAt: '02/02/2024'
  },
  {
    id: 'cust-3',
    name: 'Gabriela Lima',
    email: 'gabriela.lima@exemplo.com',
    phone: '(11) 96543-2109',
    city: 'São Paulo - Bela Vista',
    ordersCount: 4,
    totalSpent: 148.00,
    isActive: true,
    createdAt: '19/02/2024'
  },
  {
    id: 'cust-4',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@exemplo.com',
    phone: '(11) 95432-1098',
    city: 'São Paulo - Moema',
    ordersCount: 2,
    totalSpent: 78.00,
    isActive: true,
    createdAt: '10/03/2024'
  }
];

export const INITIAL_GLOBAL_ADDONS = [
  {
    id: 'addon-calda-nutella',
    name: 'Calda extra de Nutella morna',
    description: 'Pote separado 30ml para regar',
    price: 4.50
  },
  {
    id: 'addon-ninho',
    name: 'Cobertura de Leite Ninho',
    description: 'Generosamente polvilhado no topo',
    price: 3.00
  },
  {
    id: 'addon-presente',
    name: 'Embalagem para Presente',
    description: 'Caixa rígida com fita de cetim rosa',
    price: 5.00
  },
  {
    id: 'addon-cartao-afetivo',
    name: 'Toque de Ninho & Mensagem Afetiva',
    description: 'Mini cartão caligrafado à mão',
    price: 3.00
  },
  {
    id: 'addon-praline-pistache',
    name: 'Praliné extra de pistache',
    description: 'Pistache caramelizado crocante',
    price: 5.50
  },
  {
    id: 'addon-extra-frosting',
    name: 'Frosting extra de Cream Cheese',
    description: 'Pote 30g separado',
    price: 4.00
  }
];
