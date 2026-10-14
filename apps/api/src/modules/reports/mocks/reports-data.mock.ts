export interface GraduateRecordMock {
  id: string;
  idCarrera: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaTitulacion: string | null;
  fechaIngreso: string | null;
  ci: string;
  extensionCi: string;
  anioEgreso: number;
  codSis: string;
  deseaMentor: boolean;
  estado: 'VERIFICADO' | 'OBSERVADO';
  fechaCreacion: string;
  justificacion?: string;
}

// Carrera fija para Sistemas
const SISTEMAS_CARRERA_ID = 'b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c';

// Parseador de "DD/MM/YYYY" a "YYYY-MM-DD"
function parseToIso(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// 90 registros base extraídos de graduates.mock.ts
const SOURCE_GRADUATES = [
  { id: '1', fullName: 'Morales Albarracín, Valeria Sofía', sisCode: '201804921', phone: '+591 79519163', email: 'valeria.morales@postgrado.uc.edu', admissionDate: '12/02/2018', degreeDate: '24/10/2024', status: 'VERIFICADO', reviewDate: '25/11/2025', rejectionReason: null },
  { id: '2', fullName: 'Quispe Condori, Marcelo Andrés', sisCode: '201709122', phone: '+591 78156169', email: 'marcelo.quispe@est.uc.edu', admissionDate: '05/03/2017', degreeDate: '15/09/2024', status: 'OBSERVADO', reviewDate: '18/11/2025', rejectionReason: 'Documentación incompleta' },
  { id: '3', fullName: 'Espinosa Toledo, Daniela Fernanda', sisCode: '201901844', phone: '+591 72019483', email: 'daniela.espinosa@alumni.uc.edu', admissionDate: '14/02/2019', degreeDate: '05/11/2024', status: 'VERIFICADO', reviewDate: '01/10/2026', rejectionReason: null },
  { id: '4', fullName: 'Salazar Justiniano, Diego Armando', sisCode: '201805510', phone: '+591 76543210', email: 'diego.salazar@est.uc.edu', admissionDate: '11/08/2018', degreeDate: '02/10/2024', status: 'OBSERVADO', reviewDate: '30/10/2025', rejectionReason: 'Firma de solicitud no coincide' },
  { id: '5', fullName: 'Villarroel Cadima, Camilo Ernesto', sisCode: '201708301', phone: '+591 71192834', email: 'camilo.villarroel@postgrado.uc.edu', admissionDate: '01/03/2017', degreeDate: '28/08/2024', status: 'VERIFICADO', reviewDate: '18/05/2025', rejectionReason: null },
  { id: '6', fullName: 'Arce Baldivieso, Luciana Belén', sisCode: '201903490', phone: '+591 73384910', email: 'luciana.arce@alumni.uc.edu', admissionDate: '15/02/2019', degreeDate: '19/10/2024', status: 'VERIFICADO', reviewDate: '02/03/2025', rejectionReason: null },
  { id: '7', fullName: 'Camacho Zeballos, Álvaro Mateo', sisCode: '201802119', phone: '+591 74492018', email: 'alvaro.camacho@est.uc.edu', admissionDate: '06/08/2018', degreeDate: '11/11/2024', status: 'OBSERVADO', reviewDate: '05/10/2025', rejectionReason: 'Copia de CI borrosa' },
  { id: '8', fullName: 'Paz Soldán, Mariana Elena', sisCode: '201907723', phone: '+591 75583920', email: 'mariana.paz@est.uc.edu', admissionDate: '10/02/2019', degreeDate: '01/12/2024', status: 'OBSERVADO', reviewDate: '08/05/2025', rejectionReason: 'Falta certificado de egreso' },
  { id: '9', fullName: 'Guzmán Terrazas, Rodrigo Ignacio', sisCode: '201704612', phone: '+591 76619283', email: 'rodrigo.guzman@postgrado.uc.edu', admissionDate: '02/03/2017', degreeDate: '14/11/2024', status: 'VERIFICADO', reviewDate: '12/03/2025', rejectionReason: null },
  { id: '10', fullName: 'Navarro Claure, Brenda Paulina', sisCode: '201809003', phone: '+591 77728194', email: 'brenda.navarro@alumni.uc.edu', admissionDate: '12/08/2018', degreeDate: '20/10/2024', status: 'VERIFICADO', reviewDate: '02/02/2025', rejectionReason: null },
  { id: '11', fullName: 'Flores Choque, María René', sisCode: '201901842', phone: '+591 72145892', email: 'rene.flores@umss.edu.bo', admissionDate: '10/08/2019', degreeDate: '14/12/2024', status: 'VERIFICADO', reviewDate: '15/01/2025', rejectionReason: null },
  { id: '12', fullName: 'Camacho Rojas, Laura Andrea', sisCode: '201604233', phone: '+591 72845190', email: 'laura.camacho@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '08/09/2026', rejectionReason: null },
  { id: '13', fullName: 'Quispe Mamani, María Elena', sisCode: '201804512', phone: '+591 71234567', email: 'maria.quispe@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '08/09/2026', rejectionReason: null },
  { id: '14', fullName: 'Flores Sejas, Diego Armando', sisCode: '201903344', phone: '+591 70045512', email: 'diego.flores@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '09/09/2026', rejectionReason: null },
  { id: '15', fullName: 'Mamani Choque, Rosa Beatriz', sisCode: '201805871', phone: '+591 76612034', email: 'rosa.mamani@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '09/09/2026', rejectionReason: null },
  { id: '16', fullName: 'Terceros Vargas, Carlos Alberto', sisCode: '201501778', phone: '+591 71190228', email: 'carlos.terceros@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '10/09/2026', rejectionReason: null },
  { id: '17', fullName: 'Villarroel Antezana, Ana Gabriela', sisCode: '201702290', phone: '+591 79923845', email: 'ana.villarroel@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '10/09/2026', rejectionReason: null },
  { id: '18', fullName: 'Claros Montaño, Mario Fernando', sisCode: '201604910', phone: '+591 73320087', email: 'mario.claros@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '11/09/2026', rejectionReason: null },
  { id: '19', fullName: 'Rojas Peredo, Silvia Marcela', sisCode: '202006655', phone: '+591 75534901', email: 'silvia.rojas@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '11/09/2026', rejectionReason: null },
  { id: '20', fullName: 'Guzmán Arispe, Pablo Andrés', sisCode: '201703487', phone: '+591 71708294', email: 'pablo.guzman@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '14/09/2026', rejectionReason: null },
  { id: '21', fullName: 'Vargas Ledezma, Elena Sofía', sisCode: '201901126', phone: '+591 78845613', email: 'elena.vargas@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '14/09/2026', rejectionReason: null },
  { id: '22', fullName: 'Céspedes Arce, Ronald Javier', sisCode: '201605742', phone: '+591 72214960', email: 'ronald.cespedes@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '15/09/2026', rejectionReason: null },
  { id: '23', fullName: 'Soria Bustamante, Gabriela Inés', sisCode: '201502019', phone: '+591 76650338', email: 'gabriela.soria@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '15/09/2026', rejectionReason: null },
  { id: '24', fullName: 'Montaño Ríos, Iván Sebastián', sisCode: '201706118', phone: '+591 70983127', email: 'ivan.montano@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '16/09/2026', rejectionReason: null },
  { id: '25', fullName: 'Peña Salazar, Verónica Alejandra', sisCode: '201902255', phone: '+591 79017743', email: 'veronica.pena@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '16/09/2026', rejectionReason: null },
  { id: '26', fullName: 'Arce Ondarza, Daniela Patricia', sisCode: '202007390', phone: '+591 77742015', email: 'daniela.arce@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '17/09/2026', rejectionReason: null },
  { id: '27', fullName: 'Ríos Zeballos, Fernando Gabriel', sisCode: '201503864', phone: '+591 71356208', email: 'fernando.rios@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '17/09/2026', rejectionReason: null },
  { id: '28', fullName: 'Mejía Torrico, Patricia Carolina', sisCode: '201607205', phone: '+591 74428830', email: 'patricia.mejia@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '18/09/2026', rejectionReason: null },
  { id: '29', fullName: 'Zeballos Núñez, Álvaro Ignacio', sisCode: '201904471', phone: '+591 78190562', email: 'alvaro.zeballos@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '18/09/2026', rejectionReason: null },
  { id: '30', fullName: 'Aguilar Ramos, Andrea Paola', sisCode: '201864813', phone: '+591 73793371', email: 'andrea.aguilar@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '31', fullName: 'Alanoca Vidal, Bruno Iván', sisCode: '201623084', phone: '+591 73229132', email: 'bruno.alanoca@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '32', fullName: 'Apaza Luna, Carla Inés', sisCode: '201971355', phone: '+591 72664893', email: 'carla.apaza@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '33', fullName: 'Ayala Soto, Daniel José', sisCode: '201729626', phone: '+591 72100654', email: 'daniel.ayala@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '34', fullName: 'Bravo Mena, Erika Luz', sisCode: '202077897', phone: '+591 71536415', email: 'erika.bravo@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '35', fullName: 'Cáceres Rivas, Franco Abel', sisCode: '201536168', phone: '+591 79972176', email: 'franco.caceres@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '36', fullName: 'Calle Tapia, Gisela Ana', sisCode: '201884439', phone: '+591 79407937', email: 'gisela.calle@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '37', fullName: 'Condori Cruz, Hugo Raúl', sisCode: '201642710', phone: '+591 78843698', email: 'hugo.condori@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '19/09/2026', rejectionReason: null },
  { id: '38', fullName: 'Durán Ramos, Andrea Paola', sisCode: '201990981', phone: '+591 78279459', email: 'andrea.duran@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '39', fullName: 'Espinoza Vidal, Bruno Iván', sisCode: '201749252', phone: '+591 77715220', email: 'bruno.espinoza@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '40', fullName: 'Fernández Luna, Carla Inés', sisCode: '202097523', phone: '+591 77150981', email: 'carla.fernandez@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '41', fullName: 'Gutiérrez Soto, Daniel José', sisCode: '201555794', phone: '+591 76586742', email: 'daniel.gutierrez@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '42', fullName: 'Huanca Mena, Erika Luz', sisCode: '201814065', phone: '+591 76022503', email: 'erika.huanca@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '43', fullName: 'Jiménez Rivas, Franco Abel', sisCode: '201662336', phone: '+591 75458264', email: 'franco.jimenez@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '44', fullName: 'López Tapia, Gisela Ana', sisCode: '201920607', phone: '+591 74894025', email: 'gisela.lopez@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '45', fullName: 'Mercado Cruz, Hugo Raúl', sisCode: '201768878', phone: '+591 74329786', email: 'hugo.mercado@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '20/09/2026', rejectionReason: null },
  { id: '46', fullName: 'Nina Ramos, Andrea Paola', sisCode: '202027149', phone: '+591 73765547', email: 'andrea.nina@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '47', fullName: 'Orellana Vidal, Bruno Iván', sisCode: '201575420', phone: '+591 73201308', email: 'bruno.orellana@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '48', fullName: 'Paredes Luna, Carla Inés', sisCode: '201833691', phone: '+591 72637069', email: 'carla.paredes@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '49', fullName: 'Quiroga Soto, Daniel José', sisCode: '201681962', phone: '+591 72072830', email: 'daniel.quiroga@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '50', fullName: 'Rocha Mena, Erika Luz', sisCode: '201940233', phone: '+591 71508591', email: 'erika.rocha@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '51', fullName: 'Salinas Rivas, Franco Abel', sisCode: '201788504', phone: '+591 79944352', email: 'franco.salinas@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '52', fullName: 'Ticona Tapia, Gisela Ana', sisCode: '202046775', phone: '+591 79380113', email: 'gisela.ticona@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '53', fullName: 'Urquidi Cruz, Hugo Raúl', sisCode: '201595046', phone: '+591 78815874', email: 'hugo.urquidi@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '21/09/2026', rejectionReason: null },
  { id: '54', fullName: 'Nava Ortuño, Nicolás Esteban', sisCode: '201909913', phone: '+591 70952229', email: 'nicolas.nava@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '55', fullName: 'Iriarte Lazo, Bruno Sebastián', sisCode: '202009236', phone: '+591 72879263', email: 'bruno.iriarte@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '56', fullName: 'Fuentes Quiroga, Álvaro Gonzalo', sisCode: '201804308', phone: '+591 70483043', email: 'alvaro.fuentes@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '57', fullName: 'Pinto Jiménez, Elena Patricia', sisCode: '201608916', phone: '+591 76520970', email: 'elena.pinto@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '58', fullName: 'Benavides Quiroga, Tatiana Elizabeth', sisCode: '201501497', phone: '+591 74923439', email: 'tatiana.benavides@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '59', fullName: 'Paz Heredia, Renata Beatriz', sisCode: '201501125', phone: '+591 77790183', email: 'renata.paz@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '60', fullName: 'Rivera Valdivia, Karen Daniela', sisCode: '202007937', phone: '+591 77247949', email: 'karen.rivera@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '61', fullName: 'Nava Dávila, Isabel Cristina', sisCode: '201607296', phone: '+591 77181704', email: 'isabel.nava@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '62', fullName: 'Galarza Escalera, Elena Patricia', sisCode: '201909989', phone: '+591 70750759', email: 'elena.galarza@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '63', fullName: 'Dávila Echeverría, Gabriela Sofía', sisCode: '201702484', phone: '+591 79121570', email: 'gabriela.davila@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '22/09/2026', rejectionReason: null },
  { id: '64', fullName: 'Valdivia Galarza, Nicolás Esteban', sisCode: '201507889', phone: '+591 77673486', email: 'nicolas.valdivia@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '65', fullName: 'Tapia Escalera, Bruno Sebastián', sisCode: '201702577', phone: '+591 74021083', email: 'bruno.tapia@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '66', fullName: 'Ferrufino Iriarte, Yerko Andrés', sisCode: '201706700', phone: '+591 77319125', email: 'yerko.ferrufino@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '67', fullName: 'Antezana Orellana, Pablo Ernesto', sisCode: '201907390', phone: '+591 70541831', email: 'pablo.antezana@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '68', fullName: 'Cabrera Jiménez, Tatiana Elizabeth', sisCode: '201509564', phone: '+591 71871305', email: 'tatiana.cabrera@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '69', fullName: 'Lazo Cabrera, Tatiana Elizabeth', sisCode: '201601558', phone: '+591 70321281', email: 'tatiana.lazo@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '70', fullName: 'Fuentes Dávila, Jorge Alberto', sisCode: '201803685', phone: '+591 71073935', email: 'jorge.fuentes@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '14/03/2025', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '71', fullName: 'Terrazas Lafuente, Daniel Ignacio', sisCode: '201501541', phone: '+591 70344122', email: 'daniel.terrazas@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '72', fullName: 'Fuentes Paz, Adriana Lucía', sisCode: '201709037', phone: '+591 75396447', email: 'adriana.fuentes@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '73', fullName: 'Rivera Delgado, Adriana Lucía', sisCode: '201502816', phone: '+591 73471021', email: 'adriana.rivera@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'VERIFICADO', reviewDate: '23/09/2026', rejectionReason: null },
  { id: '74', fullName: 'Gamboa Quiroga, Jorge Alberto', sisCode: '201603383', phone: '+591 79995603', email: 'jorge.gamboa@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '24/09/2026', rejectionReason: null },
  { id: '75', fullName: 'Navarro Camargo, María Fernanda', sisCode: '201906182', phone: '+591 71367046', email: 'maria.navarro@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'VERIFICADO', reviewDate: '24/09/2026', rejectionReason: null },
  { id: '76', fullName: 'Navarro Escalera, Álvaro Gonzalo', sisCode: '201601723', phone: '+591 70397564', email: 'alvaro.navarro@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'VERIFICADO', reviewDate: '24/09/2026', rejectionReason: null },
  { id: '77', fullName: 'Aguilar Rocha, Marcelo Andrés', sisCode: '201705532', phone: '+591 71456023', email: 'marcelo.aguilar@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'OBSERVADO', reviewDate: '07/09/2026', rejectionReason: 'Documentación incompleta' },
  { id: '78', fullName: 'Balderrama Vega, Lucía Fernanda', sisCode: '201802217', phone: '+591 72308841', email: 'lucia.balderrama@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '14/03/2025', status: 'OBSERVADO', reviewDate: '07/09/2026', rejectionReason: 'Firma de solicitud no coincide' },
  { id: '79', fullName: 'Cardozo Pinto, Jorge Luis', sisCode: '201604675', phone: '+591 76120459', email: 'jorge.cardozo@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'OBSERVADO', reviewDate: '08/09/2026', rejectionReason: 'Copia de CI borrosa' },
  { id: '80', fullName: 'Delgadillo Ríos, Paola Andrea', sisCode: '201903918', phone: '+591 79354102', email: 'paola.delgadillo@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'OBSERVADO', reviewDate: '08/09/2026', rejectionReason: 'Falta certificado de egreso' },
  { id: '81', fullName: 'Escóbar Luna, Rodrigo Iván', sisCode: '201506244', phone: '+591 70782316', email: 'rodrigo.escobar@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'OBSERVADO', reviewDate: '09/09/2026', rejectionReason: 'Fotografía no cumple el formato solicitado' },
  { id: '82', fullName: 'Fernández Soto, Carla Daniela', sisCode: '202001873', phone: '+591 75219604', email: 'carla.fernandez@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'OBSERVADO', reviewDate: '09/09/2026', rejectionReason: 'Título en provisión nacional sin legalizar' },
  { id: '83', fullName: 'Gutiérrez Paz, Luis Alberto', sisCode: '201707140', phone: '+591 73664027', email: 'luis.gutierrez@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '14/03/2025', status: 'OBSERVADO', reviewDate: '10/09/2026', rejectionReason: 'Datos personales no coinciden con el kárdex' },
  { id: '84', fullName: 'Herrera Vidal, Natalia Sofía', sisCode: '201805396', phone: '+591 71893350', email: 'natalia.herrera@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '18/07/2024', status: 'OBSERVADO', reviewDate: '10/09/2026', rejectionReason: 'Falta comprobante de pago del trámite' },
  { id: '85', fullName: 'Iriarte Molina, Andrés Felipe', sisCode: '201602981', phone: '+591 77405128', email: 'andres.iriarte@est.umss.edu.bo', admissionDate: '05/02/2016', degreeDate: '22/11/2023', status: 'OBSERVADO', reviewDate: '11/09/2026', rejectionReason: 'Documentación incompleta' },
  { id: '86', fullName: 'Jiménez Arce, Valeria Beatriz', sisCode: '201904157', phone: '+591 78562903', email: 'valeria.jimenez@est.umss.edu.bo', admissionDate: '11/02/2019', degreeDate: '29/08/2025', status: 'OBSERVADO', reviewDate: '11/09/2026', rejectionReason: 'Firma de solicitud no coincide' },
  { id: '87', fullName: 'Lazarte Cruz, Miguel Ángel', sisCode: '201503620', phone: '+591 72147786', email: 'miguel.lazarte@est.umss.edu.bo', admissionDate: '09/02/2015', degreeDate: '05/12/2022', status: 'OBSERVADO', reviewDate: '14/09/2026', rejectionReason: 'Copia de CI borrosa' },
  { id: '88', fullName: 'Medrano Paz, Susana Elizabeth', sisCode: '201708829', phone: '+591 79630214', email: 'susana.medrano@est.umss.edu.bo', admissionDate: '13/02/2017', degreeDate: '18/07/2024', status: 'OBSERVADO', reviewDate: '14/09/2026', rejectionReason: 'Falta certificado de egreso' },
  { id: '89', fullName: 'Navia Salinas, Óscar Eduardo', sisCode: '202005461', phone: '+591 70258837', email: 'oscar.navia@est.umss.edu.bo', admissionDate: '10/02/2020', degreeDate: '19/12/2025', status: 'OBSERVADO', reviewDate: '15/09/2026', rejectionReason: 'Fotografía no cumple el formato solicitado' },
  { id: '90', fullName: 'Orellana Vargas, Mónica Isabel', sisCode: '201806713', phone: '+591 76941052', email: 'monica.orellana@est.umss.edu.bo', admissionDate: '12/02/2018', degreeDate: '14/03/2025', status: 'OBSERVADO', reviewDate: '15/09/2026', rejectionReason: 'Título en provisión nacional sin legalizar' },
];

export const MOCK_GRADUATES: GraduateRecordMock[] = SOURCE_GRADUATES.map((g, index) => {
  const [apellidos, nombres] = g.fullName.includes(',')
    ? g.fullName.split(',').map((s) => s.trim())
    : ['', g.fullName];

  const degreeIso = parseToIso(g.degreeDate);
  const anioEgreso = degreeIso ? parseInt(degreeIso.slice(0, 4), 10) : 2024;
  const isObserved = g.status === 'OBSERVADO';

  return {
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    idCarrera: SISTEMAS_CARRERA_ID,
    nombre: nombres || g.fullName,
    apellido: apellidos || '',
    telefono: g.phone,
    email: g.email,
    fechaTitulacion: degreeIso,
    fechaIngreso: parseToIso(g.admissionDate),
    ci: `${6000000 + index}`,
    extensionCi: 'CB',
    anioEgreso,
    codSis: g.sisCode,
    deseaMentor: !isObserved && index % 2 === 0,
    estado: isObserved ? 'OBSERVADO' : 'VERIFICADO',
    fechaCreacion: parseToIso(g.reviewDate) ?? '2026-09-01',
    justificacion: g.rejectionReason ?? undefined,
  };
});