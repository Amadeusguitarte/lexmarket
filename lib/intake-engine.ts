import { categories as baseCategories } from './shared';

export type LegalCategoryKey =
  | 'laboral'
  | 'familia'
  | 'civil_contractual'
  | 'comercial'
  | 'inmobiliario'
  | 'consumidor'
  | 'administrativo'
  | 'penal'
  | 'transito_responsabilidad'
  | 'propiedad_intelectual'
  | 'otro'
  | 'no_seguro';

export interface CategoryMeta {
  key: LegalCategoryKey;
  label: string;
  shortLabel: string;
  description: string;
  recommendedDocs: string[];
}

export const INTAKE_CATEGORIES: Record<LegalCategoryKey, CategoryMeta> = {
  laboral: {
    key: 'laboral',
    label: 'Laboral y seguridad social',
    shortLabel: 'Laboral',
    description: 'Despidos, salarios pendientes, liquidaciones, acoso, incapacidades o pensiones.',
    recommendedDocs: [
      'Contrato de trabajo',
      'Carta de despido o terminación',
      'Comprobantes de pago de nómina',
      'Incapacidades médicas',
      'Comunicaciones o correos con el empleador',
      'Liquidación propuesta o recibida'
    ]
  },
  familia: {
    key: 'familia',
    label: 'Familia',
    shortLabel: 'Familia',
    description: 'Divorcios, custodia, cuotas de alimentos, visitas, sucesiones o capitulaciones.',
    recommendedDocs: [
      'Registro civil de matrimonio o nacimiento',
      'Acuerdos o conciliaciones previas',
      'Pruebas de ingresos o gastos',
      'Comunicaciones relevantes',
      'Testamento o inventario (si aplica)'
    ]
  },
  civil_contractual: {
    key: 'civil_contractual',
    label: 'Civil y contractual',
    shortLabel: 'Civil y contratos',
    description: 'Incumplimiento de contratos, deudas, cobros, pagarés, daños y perjuicios.',
    recommendedDocs: [
      'Contrato o acuerdo escrito',
      'Pagaré, letra de cambio o factura',
      'Comprobantes de transferencia o recibos',
      'Comunicaciones y requerimientos previos',
      'Evidencia de incumplimiento o daños'
    ]
  },
  comercial: {
    key: 'comercial',
    label: 'Comercial y societario',
    shortLabel: 'Comercial',
    description: 'Conflictos entre socios, empresas, contratos mercantiles o cobro de facturas.',
    recommendedDocs: [
      'Certificado de existencia y representación (Cámara de Comercio)',
      'Estatutos o actas de asamblea',
      'Contrato comercial o facturas cambiarias',
      'Correspondencia mercantil'
    ]
  },
  inmobiliario: {
    key: 'inmobiliario',
    label: 'Inmobiliario y arrendamientos',
    shortLabel: 'Inmobiliario',
    description: 'Arrendamientos, desalojos, compraventa de inmuebles, posesión o propiedad horizontal.',
    recommendedDocs: [
      'Contrato de arrendamiento',
      'Certificado de tradición y libertad',
      'Comprobantes de pago de canon o servicios',
      'Inventario del inmueble con fotografías',
      'Comunicaciones o cartas de terminación'
    ]
  },
  consumidor: {
    key: 'consumidor',
    label: 'Protección al consumidor',
    shortLabel: 'Consumidor',
    description: 'Garantías, productos defectuosos, cobros indebidos, servicios financieros.',
    recommendedDocs: [
      'Factura de compra o comprobante de pago',
      'Garantía o términos del servicio',
      'Reclamación directa radicada ante el proveedor',
      'Respuesta del proveedor o comercio',
      'Fotografías o evidencia del fallo'
    ]
  },
  administrativo: {
    key: 'administrativo',
    label: 'Administrativo y entidades públicas',
    shortLabel: 'Administrativo',
    description: 'Tutelas, derechos de petición sin respuesta, sanciones, multas o controversias con el Estado.',
    recommendedDocs: [
      'Derecho de petición radicado',
      'Acto administrativo, resolución o sanción',
      'Notificaciones recibidas',
      'Soportes de la solicitud inicial'
    ]
  },
  penal: {
    key: 'penal',
    label: 'Penal',
    shortLabel: 'Penal',
    description: 'Acompañamiento a víctimas, defensas, denuncias o citaciones de Fiscalía.',
    recommendedDocs: [
      'Denuncia o noticia criminal radicada',
      'Citación o notificación de audiencia',
      'Documentos o mensajes relevantes sin datos sensibles',
      'Informes o dictámenes médicos (si aplica)'
    ]
  },
  transito_responsabilidad: {
    key: 'transito_responsabilidad',
    label: 'Tránsito y responsabilidad civil',
    shortLabel: 'Tránsito y daños',
    description: 'Accidentes de tránsito, comparendos, reclamaciones ante aseguradoras, daños a vehículos.',
    recommendedDocs: [
      'Informe policial de accidente (croquis / IPAT)',
      'Póliza de seguro y reclamación',
      'Cotizaciones de reparación o peritaje',
      'Historia clínica o incapacidades (en caso de lesiones)',
      'Comparendo notificado'
    ]
  },
  propiedad_intelectual: {
    key: 'propiedad_intelectual',
    label: 'Propiedad intelectual y marcas',
    shortLabel: 'Marcas y PI',
    description: 'Registro de marcas, patentes, derechos de autor, infracciones o acuerdos de confidencialidad.',
    recommendedDocs: [
      'Logo, nombre o diseño a proteger',
      'Certificados de registro previos (SIC o DNDA)',
      'Contratos de cesión o licencias',
      'Pruebas de uso o de infracción por terceros'
    ]
  },
  otro: {
    key: 'otro',
    label: 'Otro asunto',
    shortLabel: 'Otro',
    description: 'Cualquier situación legal que no se ajuste a las categorías anteriores.',
    recommendedDocs: [
      'Documentos principales del caso',
      'Comunicaciones o mensajes clave',
      'Cualquier escrito o antecedente'
    ]
  },
  no_seguro: {
    key: 'no_seguro',
    label: 'No estoy seguro',
    shortLabel: 'Por definir',
    description: 'Analizaremos tu descripción para sugerir la mejor ruta con profesionales adecuados.',
    recommendedDocs: [
      'Cualquier documento o mensaje que tengas a mano'
    ]
  }
};

export interface QuestionOption {
  value: string;
  label: string;
  helper?: string;
}

export interface IntakeQuestion {
  id: string;
  category: LegalCategoryKey | 'global';
  question: string;
  helper?: string;
  whyWeAsk?: string;
  type: 'single_select' | 'multi_select' | 'text' | 'date';
  options?: QuestionOption[];
  supportsOther?: boolean;
  supportsUnsure?: boolean;
  canSkipLater?: boolean;
  placeholder?: string;
  showWhen?: (answers: Record<string, any>, facts?: ExtractedFacts) => boolean;
}

export interface ExtractedFacts {
  suggestedCategory: LegalCategoryKey;
  secondaryCategory?: LegalCategoryKey;
  categoryLabel: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  desiredOutcome: string;
  importantDates: string[];
  detectedCity: string;
  urgency: 'normal' | 'soon' | 'urgent';
  extractedFacts: string[];
  counterpartyHint?: string;
}

export interface Counterparty {
  id: string;
  type: 'persona' | 'empresa' | 'entidad' | 'no_se';
  name: string;
  idNumber?: string;
  role: string;
}

export interface PrivateClientData {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  counterparties: Counterparty[];
}

export interface PrivacyPreferences {
  publishAnonymously: boolean;
  allowProposals: boolean;
  allowDocumentAccessRequests: boolean;
}

export interface LawyerAccessGrant {
  lawyerId: string;
  lawyerName: string;
  lawyerAvatar?: string;
  canViewSummary: boolean;
  canViewFacts: boolean;
  canViewIdentity: boolean;
  canViewPrivateParties: boolean;
  grantedDocumentIds: string[];
  canViewFullExpediente: boolean;
  requestedAt?: string;
  grantedAt?: string;
}

// Global questions that apply across all intake branches
export const GLOBAL_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'city',
    category: 'global',
    question: '¿En qué ciudad o municipio ocurrió?',
    helper: 'Lo usamos para identificar profesionales habilitados que puedan atender tu asunto en esa jurisdicción.',
    type: 'text',
    placeholder: 'Ejemplo: Bogotá, Medellín, Cali, Barranquilla...',
    canSkipLater: false
  },
  {
    id: 'urgency_deadline',
    category: 'global',
    question: '¿Hay una fecha límite, audiencia o algo urgente?',
    helper: 'Esto ayuda a priorizar tu caso y advertir sobre posibles vencimientos.',
    type: 'single_select',
    options: [
      { value: 'si', label: 'Sí' },
      { value: 'no', label: 'No' },
      { value: 'no_seguro', label: 'No estoy seguro' }
    ],
    canSkipLater: true
  },
  {
    id: 'urgency_date',
    category: 'global',
    question: '¿Cuál es la fecha límite o de la audiencia?',
    whyWeAsk: 'Los abogados revisan los términos procesales para confirmar si tienen disponibilidad inmediata.',
    type: 'date',
    showWhen: (answers) => answers['urgency_deadline'] === 'si',
    canSkipLater: true
  },
  {
    id: 'authority_involved',
    category: 'global',
    question: '¿Esto ya está siendo tratado por una autoridad, juzgado o entidad pública?',
    type: 'single_select',
    options: [
      { value: 'si', label: 'Sí' },
      { value: 'no', label: 'No' },
      { value: 'no_seguro', label: 'No estoy seguro' }
    ],
    canSkipLater: true
  },
  {
    id: 'authority_name',
    category: 'global',
    question: '¿Sabes qué juzgado o entidad lo está llevando?',
    type: 'text',
    placeholder: 'Ejemplo: Juzgado 15 Laboral, Inspección de Policía, DIAN...',
    supportsOther: true,
    supportsUnsure: true,
    showWhen: (answers) => answers['authority_involved'] === 'si',
    canSkipLater: true
  },
  {
    id: 'desired_goal',
    category: 'global',
    question: '¿Qué te gustaría lograr principalmente?',
    helper: 'Selecciona la opción que mejor describa tu objetivo en este momento.',
    type: 'single_select',
    options: [
      { value: 'entender_opciones', label: 'Entender mis opciones y viabilidad' },
      { value: 'llegar_acuerdo', label: 'Llegar a un acuerdo o conciliación' },
      { value: 'recuperar_dinero', label: 'Recuperar dinero o bienes' },
      { value: 'defenderme', label: 'Defenderme de un reclamo o acusación' },
      { value: 'iniciar_demanda', label: 'Iniciar una demanda o acción legal' },
      { value: 'responder_demanda', label: 'Responder a una demanda o notificación' },
      { value: 'revisar_documentos', label: 'Preparar o revisar contratos y documentos' },
      { value: 'representacion', label: 'Obtener representación formal de un abogado' }
    ],
    supportsOther: true,
    canSkipLater: false
  }
];

// Branching questions per Colombian legal category
export const CATEGORY_QUESTION_SETS: Record<LegalCategoryKey, IntakeQuestion[]> = {
  laboral: [
    {
      id: 'employment_status',
      category: 'laboral',
      question: '¿Sigues trabajando allí?',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
        { value: 'no_seguro', label: 'No estoy seguro' }
      ]
    },
    {
      id: 'employment_relationship',
      category: 'laboral',
      question: '¿Qué tipo de vínculo tenías?',
      whyWeAsk: 'En Colombia los derechos y liquidaciones varían según el contrato laboral o de servicios.',
      type: 'single_select',
      options: [
        { value: 'indefinido', label: 'Contrato a término indefinido' },
        { value: 'fijo', label: 'Contrato a término fijo' },
        { value: 'servicios', label: 'Prestación de servicios' },
        { value: 'obra_labor', label: 'Contrato por obra o labor' },
        { value: 'verbal', label: 'Contrato verbal' },
        { value: 'no_se', label: 'No lo sé con certeza' }
      ],
      supportsOther: true
    },
    {
      id: 'labor_situation',
      category: 'laboral',
      question: '¿Qué ocurrió principalmente?',
      type: 'single_select',
      options: [
        { value: 'despido', label: 'Despido (con o sin justa causa)' },
        { value: 'falta_pago', label: 'Falta de pago de salario o prestaciones' },
        { value: 'liquidacion', label: 'Disconformidad con la liquidación' },
        { value: 'acoso', label: 'Acoso o persecución laboral' },
        { value: 'incapacidad', label: 'Despido o problema estando incapacitado(a)' },
        { value: 'accidente', label: 'Accidente de trabajo o enfermedad laboral' },
        { value: 'seguridad_social', label: 'Falta de afiliación o aportes a pensión/salud' },
        { value: 'cambio_condiciones', label: 'Cambio unilateral de condiciones (desmejora)' }
      ],
      supportsOther: true
    },
    {
      id: 'dismissal_date',
      category: 'laboral',
      question: '¿Cuándo terminó la relación laboral?',
      helper: 'Si no recuerdas el día exacto, el mes y año son de gran ayuda.',
      type: 'text',
      placeholder: 'Ejemplo: 15 de marzo de 2026, o a principios de mes',
      showWhen: (answers) => answers['employment_status'] === 'no' || answers['labor_situation'] === 'despido',
      canSkipLater: true
    },
    {
      id: 'unpaid_concepts',
      category: 'laboral',
      question: '¿Qué conceptos están pendientes de pago?',
      type: 'multi_select',
      options: [
        { value: 'salario', label: 'Salarios atrasados' },
        { value: 'prestaciones', label: 'Prestaciones (primas, cesantías, intereses)' },
        { value: 'liquidacion', label: 'Liquidación final' },
        { value: 'comisiones', label: 'Comisiones o bonificaciones' },
        { value: 'horas_extra', label: 'Horas extra o recargos nocturnos' },
        { value: 'indemnizacion', label: 'Indemnización por despido injustificado' }
      ],
      supportsOther: true,
      supportsUnsure: true,
      showWhen: (answers) => answers['labor_situation'] === 'falta_pago' || answers['labor_situation'] === 'liquidacion'
    }
  ],

  familia: [
    {
      id: 'family_topic',
      category: 'familia',
      question: '¿Sobre qué trata principalmente el asunto?',
      type: 'single_select',
      options: [
        { value: 'divorcio', label: 'Divorcio o cesación de efectos civiles' },
        { value: 'custodia', label: 'Custodia y cuidado personal' },
        { value: 'alimentos', label: 'Fijación, aumento o disminución de cuota de alimentos' },
        { value: 'visitas', label: 'Régimen de visitas' },
        { value: 'union_marital', label: 'Unión marital de hecho y sociedad patrimonial' },
        { value: 'sucesion', label: 'Sucesión o herencia' },
        { value: 'violencia', label: 'Medidas de protección por violencia intrafamiliar' }
      ],
      supportsOther: true
    },
    {
      id: 'minors_involved',
      category: 'familia',
      question: '¿Hay niños, niñas o adolescentes (menores de 18 años) involucrados?',
      whyWeAsk: 'En Colombia los procesos que involucran menores tienen prioridad legal y requieren intervención de Defensoría de Familia.',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      id: 'marriage_type',
      category: 'familia',
      question: '¿Existe matrimonio civil o religioso?',
      type: 'single_select',
      options: [
        { value: 'civil', label: 'Matrimonio civil' },
        { value: 'religioso', label: 'Matrimonio religioso (católico u otro con efectos civiles)' },
        { value: 'union_libre', label: 'Unión libre / de hecho' },
        { value: 'no_seguro', label: 'No estoy seguro' }
      ],
      supportsOther: true,
      showWhen: (answers) => answers['family_topic'] === 'divorcio' || answers['family_topic'] === 'union_marital'
    },
    {
      id: 'will_exists',
      category: 'familia',
      question: '¿La persona fallecida dejó testamento?',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
        { value: 'no_se', label: 'No lo sé' }
      ],
      showWhen: (answers) => answers['family_topic'] === 'sucesion'
    }
  ],

  civil_contractual: [
    {
      id: 'contract_exists',
      category: 'civil_contractual',
      question: '¿Existe un contrato o acuerdo entre las partes?',
      type: 'single_select',
      options: [
        { value: 'escrito', label: 'Sí, por escrito (físico o digital)' },
        { value: 'verbal', label: 'Sí, un acuerdo verbal' },
        { value: 'no', label: 'No existe contrato formal' },
        { value: 'no_seguro', label: 'No estoy seguro' }
      ]
    },
    {
      id: 'civil_problem',
      category: 'civil_contractual',
      question: '¿Cuál es el problema principal?',
      type: 'single_select',
      options: [
        { value: 'incumplimiento', label: 'Incumplimiento de lo pactado o entregado' },
        { value: 'deuda', label: 'Una deuda o dinero no pagado' },
        { value: 'danos', label: 'Daños a personas o bienes (responsabilidad civil)' },
        { value: 'terminacion', label: 'Terminación anticipada o resolución de contrato' },
        { value: 'cobro_judicial', label: 'Cobro por vía judicial o ejecutiva' }
      ],
      supportsOther: true
    },
    {
      id: 'debt_document',
      category: 'civil_contractual',
      question: '¿Existe algún documento que respalde la obligación?',
      helper: 'Títulos valores o soportes que demuestren la deuda.',
      type: 'multi_select',
      options: [
        { value: 'pagare_letra', label: 'Pagaré o letra de cambio' },
        { value: 'contrato', label: 'Contrato firmado' },
        { value: 'factura', label: 'Factura de venta' },
        { value: 'mensajes', label: 'Conversaciones por chat, correo o transferencias' },
        { value: 'ninguno', label: 'No tengo documento de respaldo' }
      ],
      supportsOther: true,
      showWhen: (answers) => answers['civil_problem'] === 'deuda' || answers['civil_problem'] === 'cobro_judicial'
    }
  ],

  comercial: [
    {
      id: 'company_involved',
      category: 'comercial',
      question: '¿El asunto involucra una empresa, sociedad o actividad mercantil?',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
        { value: 'no_seguro', label: 'No estoy seguro' }
      ]
    },
    {
      id: 'commercial_situation',
      category: 'comercial',
      question: '¿Qué tipo de situación es?',
      type: 'single_select',
      options: [
        { value: 'socios', label: 'Conflicto entre socios o accionistas' },
        { value: 'constitucion', label: 'Constitución o reestructuración de sociedad' },
        { value: 'contrato_mercantil', label: 'Contrato comercial o de distribución' },
        { value: 'cobro_empresarial', label: 'Cobro de cartera empresarial' },
        { value: 'administradores', label: 'Responsabilidad de administradores o gerencia' },
        { value: 'liquidacion_sociedad', label: 'Disolución y liquidación de sociedad' }
      ],
      supportsOther: true
    }
  ],

  inmobiliario: [
    {
      id: 'property_type',
      category: 'inmobiliario',
      question: '¿Qué tipo de inmueble está involucrado?',
      type: 'single_select',
      options: [
        { value: 'vivienda', label: 'Vivienda (casa o apartamento)' },
        { value: 'local', label: 'Local comercial u oficina' },
        { value: 'lote', label: 'Lote, finca o terreno' },
        { value: 'propiedad_horizontal', label: 'Edificio o conjunto residencial' }
      ],
      supportsOther: true
    },
    {
      id: 'property_situation',
      category: 'inmobiliario',
      question: '¿Cuál es la situación actual?',
      type: 'single_select',
      options: [
        { value: 'arrendamiento', label: 'Arrendamiento (no pago, canon o prórroga)' },
        { value: 'restitucion', label: 'Desalojo / restitución del inmueble' },
        { value: 'compraventa', label: 'Problemas en compraventa o promesa' },
        { value: 'posesion', label: 'Posesión o prescripción adquisitiva' },
        { value: 'lindes', label: 'Problemas de linderos o escrituración' },
        { value: 'propiedad_horizontal', label: 'Conflicto con administración o asamblea de copropietarios' }
      ],
      supportsOther: true
    }
  ],

  consumidor: [
    {
      id: 'consumer_acquired',
      category: 'consumidor',
      question: '¿Qué adquiriste?',
      type: 'single_select',
      options: [
        { value: 'producto', label: 'Un producto físico (electrodoméstico, vehículo, ropa...)' },
        { value: 'servicio', label: 'Un servicio (turismo, salud, educación, telecomunicaciones...)' },
        { value: 'financiero', label: 'Un producto financiero (tarjeta, crédito, seguros...)' },
        { value: 'compra_online', label: 'Una compra por internet o comercio electrónico' }
      ],
      supportsOther: true
    },
    {
      id: 'direct_claim_made',
      category: 'consumidor',
      question: '¿Ya reclamaste directamente al proveedor o comercio?',
      whyWeAsk: 'En Colombia es requisito radicar una reclamación directa previa antes de acudir a la Superintendencia de Industria y Comercio (SIC).',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      id: 'claim_result',
      category: 'consumidor',
      question: '¿Cuándo reclamaste y qué respuesta te dieron?',
      type: 'text',
      placeholder: 'Ejemplo: Reclamé el 10 de septiembre y negaron el cambio...',
      showWhen: (answers) => answers['direct_claim_made'] === 'si',
      canSkipLater: true
    }
  ],

  administrativo: [
    {
      id: 'entity_involved',
      category: 'administrativo',
      question: '¿Qué entidad pública o autoridad está involucrada?',
      type: 'text',
      placeholder: 'Ejemplo: DIAN, Alcaldía, Colpensiones, Superintendencia...',
      supportsUnsure: true,
      canSkipLater: true
    },
    {
      id: 'administrative_act',
      category: 'administrativo',
      question: '¿Qué tipo de actuación ocurrió?',
      type: 'single_select',
      options: [
        { value: 'derecho_peticion', label: 'Derecho de petición sin respuesta o incompleta' },
        { value: 'tutela', label: 'Vulneración de derecho fundamental (Acción de tutela)' },
        { value: 'sancion', label: 'Sanción o multa administrativa' },
        { value: 'acto_administrativo', label: 'Acto administrativo que afecta mis derechos' },
        { value: 'contratacion_estatal', label: 'Contrato estatal o licitación pública' },
        { value: 'tramite', label: 'Trámite o solicitud demorada sin justificación' }
      ],
      supportsOther: true
    }
  ],

  penal: [
    {
      id: 'penal_role',
      category: 'penal',
      question: '¿Buscas orientación como?',
      whyWeAsk: 'Para determinar si requieres representación como víctima o defensa técnica del investigado.',
      type: 'single_select',
      options: [
        { value: 'victima', label: 'Víctima o afectado(a)' },
        { value: 'denunciado', label: 'Persona denunciada o investigada' },
        { value: 'familiar', label: 'Familiar de alguien privado de la libertad o procesado' },
        { value: 'no_seguro', label: 'No estoy seguro' }
      ],
      supportsOther: true
    },
    {
      id: 'denuncia_status',
      category: 'penal',
      question: '¿Existe una denuncia o proceso penal abierto?',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí, ya está en la Fiscalía o juzgado' },
        { value: 'no', label: 'No, quiero presentar una denuncia' },
        { value: 'no_se', label: 'No lo sé con certeza' }
      ]
    },
    {
      id: 'upcoming_hearing',
      category: 'penal',
      question: '¿Hay una audiencia, citación o vencimiento próximo?',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí, hay fecha fijada' },
        { value: 'no', label: 'No por ahora' },
        { value: 'no_se', label: 'No lo sé' }
      ]
    }
  ],

  transito_responsabilidad: [
    {
      id: 'transito_event',
      category: 'transito_responsabilidad',
      question: '¿Qué ocurrió principalmente?',
      type: 'single_select',
      options: [
        { value: 'accidente', label: 'Accidente o choque de tránsito' },
        { value: 'danos_materiales', label: 'Daños materiales a vehículos o propiedades' },
        { value: 'lesiones', label: 'Lesiones personales de conductor, pasajero o peatón' },
        { value: 'aseguradora', label: 'Problemas de cobertura con aseguradora (SOAT o Todo Riesgo)' },
        { value: 'comparendo', label: 'Inconformidad con fotomulta o comparendo de tránsito' }
      ],
      supportsOther: true
    },
    {
      id: 'croquis_exists',
      category: 'transito_responsabilidad',
      question: '¿Existe informe policial de accidente (croquis / IPAT)?',
      type: 'single_select',
      options: [
        { value: 'si', label: 'Sí, las autoridades levantaron informe' },
        { value: 'no', label: 'No se levantó informe' },
        { value: 'no_se', label: 'No lo sé' }
      ]
    }
  ],

  propiedad_intelectual: [
    {
      id: 'ip_matter',
      category: 'propiedad_intelectual',
      question: '¿Qué deseas proteger o resolver?',
      type: 'single_select',
      options: [
        { value: 'marca', label: 'Registro o defensa de marca o lema comercial' },
        { value: 'derechos_autor', label: 'Derechos de autor (software, música, libros, diseño)' },
        { value: 'patente', label: 'Patente de invención o modelo de utilidad' },
        { value: 'infraccion', label: 'Alguien está usando mi marca o contenido sin permiso' },
        { value: 'acuerdo_nda', label: 'Acuerdo de confidencialidad o licencia' }
      ],
      supportsOther: true
    }
  ],

  otro: [
    {
      id: 'generic_parties',
      category: 'otro',
      question: '¿Quiénes están involucrados principalmente?',
      type: 'single_select',
      options: [
        { value: 'persona', label: 'Una persona particular' },
        { value: 'empresa', label: 'Una empresa privada' },
        { value: 'entidad', label: 'Una entidad pública o del Estado' },
        { value: 'empleador', label: 'Mi empleador o ex-empleador' },
        { value: 'familiar', label: 'Un familiar o expareja' },
        { value: 'no_seguro', label: 'No estoy seguro' }
      ],
      supportsOther: true
    },
    {
      id: 'generic_issue',
      category: 'otro',
      question: '¿Qué describe mejor lo que ocurrió?',
      type: 'single_select',
      options: [
        { value: 'incumplimiento', label: 'Alguien incumplió un compromiso o acuerdo' },
        { value: 'deuda', label: 'Me deben dinero o me están cobrando injustamente' },
        { value: 'defensa', label: 'Quiero defenderme de una acusación o reclamo' },
        { value: 'reclamacion', label: 'Quiero hacer un reclamo o exigir un derecho' },
        { value: 'revisar_doc', label: 'Necesito revisar un documento legal antes de firmar' },
        { value: 'autoridad', label: 'Tengo un problema con una entidad o autoridad' }
      ],
      supportsOther: true
    }
  ],

  no_seguro: [
    {
      id: 'unsure_parties',
      category: 'no_seguro',
      question: '¿Quién está involucrado?',
      type: 'single_select',
      options: [
        { value: 'persona', label: 'Una persona particular' },
        { value: 'empresa', label: 'Una empresa' },
        { value: 'entidad', label: 'Una entidad pública' },
        { value: 'empleador', label: 'Mi empleador' },
        { value: 'familiar', label: 'Un familiar' }
      ],
      supportsOther: true,
      supportsUnsure: true
    },
    {
      id: 'unsure_situation',
      category: 'no_seguro',
      question: '¿Qué ocurrió principalmente?',
      type: 'single_select',
      options: [
        { value: 'incumplimiento', label: 'Alguien incumplió algo' },
        { value: 'deuda', label: 'Me deben dinero' },
        { value: 'defensa', label: 'Quiero defenderme' },
        { value: 'reclamacion', label: 'Quiero reclamar algo' },
        { value: 'revisar_doc', label: 'Necesito revisar un documento' },
        { value: 'autoridad', label: 'Tengo un problema con una autoridad' },
        { value: 'no_clasificar', label: 'No sé cómo clasificarlo' }
      ],
      supportsOther: true
    }
  ]
};

// Colombian cities for extraction heuristics
const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga',
  'Pereira', 'Santa Marta', 'Ibagué', 'Cúcuta', 'Manizales', 'Pasto',
  'Neiva', 'Villavicencio', 'Armenia', 'Valledupar', 'Monlería', 'Popayán',
  'Sincelejo', 'Tunja', 'Riohacha', 'Florencia', 'Yopal', 'Quibdó'
];

/**
 * Intelligent Client-Side NLP Heuristic Narrative Analyzer.
 * Extracts provisional category, secondary category, city, important dates,
 * urgency, non-identifying summary, facts, and desired outcomes.
 */
export function analyzeNarrativeHeuristically(narrative: string): ExtractedFacts {
  const text = narrative.trim();
  const lower = text.toLowerCase();

  // 1. Detect Category & Secondary Category
  let categoryScore: Record<LegalCategoryKey, number> = {
    laboral: 0,
    familia: 0,
    civil_contractual: 0,
    comercial: 0,
    inmobiliario: 0,
    consumidor: 0,
    administrativo: 0,
    penal: 0,
    transito_responsabilidad: 0,
    propiedad_intelectual: 0,
    otro: 0,
    no_seguro: 0
  };

  // Labor keywords
  if (/(despid|emplead|jefe|salario|n[oó]mina|liquidaci[oó]n|cesant|prestaci|acoso laboral|incapacidad|\b(arl|eps)\b|trabajo|laboral|prestaci[oó]n de servicios|renunci)/.test(lower)) {
    categoryScore.laboral += 4;
  }
  // Familia keywords
  if (/(divorcio|custodia|alimentos|cuota alimentaria|hijo|menor|exespos|c[oó]nyuge|matrimonio|uni[oó]n marital|sucesi[oó]n|herencia|testamento|violencia intrafamiliar)/.test(lower)) {
    categoryScore.familia += 4;
  }
  // Inmobiliario keywords
  if (/(arrend|inquilino|arrendador|inmueble|apartamento|canon|restituci[oó]n|desalojo|propiedad horizontal|conjunto|administraci[oó]n|compraventa)/.test(lower)) {
    categoryScore.inmobiliario += 4;
  }
  // Civil / Contractual keywords
  if (/(contrato|deuda|debe|pagar[eé]|letra|factura|incumpli|cobro|pr[eé]stamo|da[nñ]o|perjuicio)/.test(lower)) {
    categoryScore.civil_contractual += 3;
  }
  // Comercial keywords
  if (/(empresa|sociedad|socios|\b(sas|s\.a\.s)\b|c[aá]mara de comercio|mercantil|estatutos|asamblea|quiebra)/.test(lower)) {
    categoryScore.comercial += 4;
  }
  // Consumidor keywords
  if (/(garant[ií]a|defecto|producto|\b(sic)\b|superintendencia de industria|compr[eé]|proveedor|almac[eé]n|devoluci[oó]n)/.test(lower)) {
    categoryScore.consumidor += 4;
  }
  // Administrativo keywords
  if (/(entidad|\b(dian)\b|alcald[ií]a|secretar[ií]a|tutela|derecho de petici[oó]n|multa|comparendo|acto administrativo|resoluci[oó]n|sanci[oó]n)/.test(lower)) {
    categoryScore.administrativo += 4;
  }
  // Penal keywords
  if (/(denuncia|fiscal[ií]a|delito|estafa|amenaza|v[ií]ctima|c[aá]rcel|captura|audiencia de imputaci[oó]n|lesi[oó]n)/.test(lower)) {
    categoryScore.penal += 4;
  }
  // Tránsito keywords
  if (/(accidente|tr[aá]nsito|choque|veh[ií]culo|soat|croquis|ipat|fotomulta)/.test(lower)) {
    categoryScore.transito_responsabilidad += 4;
  }
  // Propiedad intelectual keywords
  if (/(marca|patente|derechos de autor|logo|plagio|propiedad intelectual)/.test(lower)) {
    categoryScore.propiedad_intelectual += 4;
  }

  // Sort scores
  const sortedCategories = (Object.keys(categoryScore) as LegalCategoryKey[]).sort(
    (a, b) => categoryScore[b] - categoryScore[a]
  );

  const topCategory = sortedCategories[0];
  const secondCategory = sortedCategories[1];

  let suggestedCategory: LegalCategoryKey = 'otro';
  let secondaryCategory: LegalCategoryKey | undefined = undefined;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (/(no s[eé]|no tengo claro|no s[eé] c[oó]mo clasificar)/.test(lower) && categoryScore[topCategory] < 5) {
    suggestedCategory = 'no_seguro';
    confidence = 'low';
  } else if (categoryScore[topCategory] >= 4) {
    suggestedCategory = topCategory;
    confidence = categoryScore[topCategory] >= 7 ? 'high' : 'medium';
    if (categoryScore[secondCategory] >= 3 && secondCategory !== topCategory) {
      secondaryCategory = secondCategory;
    }
  } else if (categoryScore[topCategory] >= 2) {
    suggestedCategory = topCategory;
    confidence = 'medium';
  } else {
    suggestedCategory = 'no_seguro';
    confidence = 'low';
  }

  // 2. City Detection (supports accented and unaccented variations)
  let detectedCity = '';
  const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const city of COLOMBIAN_CITIES) {
    const normCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${normCity}(?:$|[^a-zA-Z0-9])`, 'i');
    if (regex.test(normalizedText)) {
      detectedCity = city;
      break;
    }
  }

  // 3. Urgency Detection
  let urgency: 'normal' | 'soon' | 'urgent' = 'normal';
  if (/(urgente|inmediato|plazo|vence|ma[nñ]ana|audiencia ma[nñ]ana|término|desalojo ma[nñ]ana|detenido)/.test(lower)) {
    urgency = 'urgent';
  } else if (/(esta semana|pronto|d[ií]as|citaci[oó]n)/.test(lower)) {
    urgency = 'soon';
  }

  // 4. Important Dates Extraction
  const dateRegex = /\b(\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(\s+de\s+\d{2,4})?|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|la semana pasada|hace un mes|ayer)\b/gi;
  const detectedDates: string[] = [];
  let match;
  while ((match = dateRegex.exec(text)) !== null) {
    if (!detectedDates.includes(match[0])) {
      detectedDates.push(match[0]);
    }
  }

  // 5. Relevant Facts and Summary Extraction
  const sentences = text
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const extractedFacts = sentences.slice(0, 4);

  // Generate an objective, non-identifying summary
  let summary = text;
  if (sentences.length > 0) {
    summary = sentences.slice(0, 2).join('. ') + (sentences.length > 1 ? '.' : '');
  }
  if (summary.length > 250) {
    summary = summary.slice(0, 247) + '...';
  }

  // Desired outcome heuristic
  let desiredOutcome = 'Entender mis opciones y posibles reclamaciones.';
  if (/(acuerdo|conciliar|arreglar)/.test(lower)) {
    desiredOutcome = 'Llegar a un acuerdo o conciliación amistosa.';
  } else if (/(recuperar|plata|dinero|pago)/.test(lower)) {
    desiredOutcome = 'Recuperar dineros adeudados o compensación económica.';
  } else if (/(demandar|demanda)/.test(lower)) {
    desiredOutcome = 'Iniciar una demanda legal formal.';
  } else if (/(defend|defens)/.test(lower)) {
    desiredOutcome = 'Defenderme ante la situación expuesta.';
  }

  return {
    suggestedCategory,
    secondaryCategory,
    categoryLabel: INTAKE_CATEGORIES[suggestedCategory]?.label || 'General',
    confidence,
    summary,
    desiredOutcome,
    importantDates: detectedDates.length > 0 ? detectedDates : ['No especificadas en el relato'],
    detectedCity,
    urgency,
    extractedFacts: extractedFacts.length > 0 ? extractedFacts : [text.slice(0, 120)]
  };
}

/**
 * Maps legal category keys to system base categories for backward compatibility
 */
export function mapToSystemCategory(key: LegalCategoryKey): (typeof baseCategories)[number] {
  switch (key) {
    case 'laboral':
      return 'Laboral';
    case 'familia':
      return 'Familia';
    case 'civil_contractual':
      return 'Civil';
    case 'inmobiliario':
      return 'Arrendamientos';
    case 'comercial':
      return 'Comercial';
    case 'consumidor':
      return 'Consumidor';
    case 'administrativo':
      return 'Administrativo';
    case 'penal':
      return 'Penal';
    default:
      return 'Otro';
  }
}
