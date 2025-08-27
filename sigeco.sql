-- phpMyAdmin SQL Dump
-- version 5.2.1deb1+deb12u1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 27-08-2025 a las 19:57:55
-- Versión del servidor: 10.11.11-MariaDB-0+deb12u1
-- Versión de PHP: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sigeco`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bases_de_datos`
--

CREATE TABLE `bases_de_datos` (
  `id_base` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `origen` varchar(100) DEFAULT NULL,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bases_de_datos`
--

INSERT INTO `bases_de_datos` (`id_base`, `nombre`, `origen`, `fecha_creado`) VALUES
(1, 'Base Importados', 'importacion', '2025-07-09 05:01:12'),
(8, 'Cultura Los lagos 2025', 'Importación', '2025-08-25 01:07:18'),
(9, 'TIC Scl20', 'Importación', '2025-08-26 04:40:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `campanas`
--

CREATE TABLE `campanas` (
  `id_campana` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `id_subevento` int(11) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `estado` enum('Borrador','Activa','Pausada','Finalizada') NOT NULL DEFAULT 'Borrador',
  `url_amigable` varchar(255) DEFAULT NULL,
  `inscripcion_libre` tinyint(1) NOT NULL DEFAULT 1,
  `landing_page_json` longtext DEFAULT NULL,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `campanas`
--

INSERT INTO `campanas` (`id_campana`, `id_evento`, `id_subevento`, `nombre`, `estado`, `url_amigable`, `inscripcion_libre`, `landing_page_json`, `fecha_creado`, `fecha_modificado`) VALUES
(13, 19, 38, 'MINCAP - Seminario Castro, 27 ago', 'Activa', 'castro', 0, NULL, '2025-08-21 23:27:00', '2025-08-25 02:16:57'),
(19, 17, NULL, 'Campana General - Muni de Pudahuel-dia dirigente social_sep25', 'Borrador', NULL, 1, NULL, '2025-08-20 04:38:43', '2025-08-20 04:38:43'),
(20, 18, NULL, 'Campana General - MMA - Simposio Cambio climatico_oct25', 'Borrador', NULL, 1, NULL, '2025-08-20 12:00:47', '2025-08-20 12:00:47'),
(21, 19, NULL, 'Campana General - MINCAL - Seminarios Castro y Pto Montt', 'Borrador', NULL, 0, NULL, '2025-08-20 12:07:32', '2025-08-23 19:01:33'),
(22, 20, NULL, 'Campana General - Muni de Chiguayante', 'Borrador', NULL, 1, NULL, '2025-08-20 12:09:16', '2025-08-20 12:09:16'),
(23, 21, NULL, 'Campana General - City Lab', 'Borrador', NULL, 1, NULL, '2025-08-20 12:12:06', '2025-08-20 12:12:06'),
(24, 22, NULL, 'Campana General - Muni de Pudahuel-dia ddel funcionario', 'Borrador', NULL, 1, NULL, '2025-08-23 02:48:44', '2025-08-23 02:48:44'),
(25, 23, NULL, 'Campana General - Muni Talcahuano', 'Borrador', NULL, 1, NULL, '2025-08-23 02:55:49', '2025-08-23 02:55:49'),
(27, 19, 40, 'MINCAP - Seminario Puerto Montt, 27 oct 2025', 'Activa', 'mincap', 1, NULL, '2025-08-25 03:25:31', '2025-08-25 14:08:01'),
(28, 24, NULL, 'Campana General - Muni San Pedro de la paz - Dia dirigente social ago25', 'Borrador', NULL, 1, NULL, '2025-08-26 04:09:15', '2025-08-26 04:09:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `campana_formulario_config`
--

CREATE TABLE `campana_formulario_config` (
  `id_config` int(11) NOT NULL,
  `id_campana` int(11) NOT NULL,
  `id_campo` int(11) NOT NULL,
  `es_visible` tinyint(1) NOT NULL DEFAULT 1,
  `es_obligatorio` tinyint(1) NOT NULL DEFAULT 0,
  `orden` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `campana_formulario_config`
--

INSERT INTO `campana_formulario_config` (`id_config`, `id_campana`, `id_campo`, `es_visible`, `es_obligatorio`, `orden`) VALUES
(763, 27, 1, 1, 1, 1),
(764, 27, 3, 1, 1, 2),
(765, 27, 4, 1, 1, 3),
(766, 27, 5, 1, 0, 4),
(767, 27, 6, 1, 0, 5),
(768, 27, 7, 1, 0, 6),
(769, 27, 8, 1, 0, 7),
(770, 27, 9, 1, 1, 8),
(771, 27, 10, 1, 1, 9),
(772, 27, 53, 1, 0, 9),
(773, 27, 54, 1, 0, 10),
(827, 13, 1, 1, 1, 1),
(828, 13, 3, 1, 1, 3),
(829, 13, 4, 1, 1, 4),
(830, 13, 5, 0, 0, 5),
(831, 13, 6, 0, 0, 6),
(832, 13, 7, 0, 0, 7),
(833, 13, 8, 0, 0, 8),
(834, 13, 51, 1, 0, 8),
(835, 13, 9, 1, 1, 9),
(836, 13, 52, 1, 0, 9),
(837, 13, 57, 1, 0, 10);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `campo_opciones`
--

CREATE TABLE `campo_opciones` (
  `id_opcion` int(11) NOT NULL,
  `id_campo` int(11) NOT NULL,
  `etiqueta_opcion` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `campo_opciones`
--

INSERT INTO `campo_opciones` (`id_opcion`, `id_campo`, `etiqueta_opcion`) VALUES
(1, 29, 'Hombre'),
(2, 29, 'Mujer'),
(3, 29, 'Prefiero no decirlo'),
(4, 30, 'si'),
(5, 30, 'mañana'),
(6, 30, 'rtres'),
(43, 51, 'Single'),
(44, 51, 'Doble'),
(45, 51, 'No requiere'),
(46, 52, 'Vegano'),
(47, 52, 'Vegetariano'),
(48, 52, 'Normal'),
(49, 53, 'Single'),
(50, 53, 'Doble'),
(51, 53, 'Sin habitacion'),
(52, 54, 'Vegetariano'),
(53, 54, 'Vegano'),
(54, 54, 'Normal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contactos`
--

CREATE TABLE `contactos` (
  `id_contacto` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `rut` varchar(20) DEFAULT NULL,
  `empresa` varchar(255) DEFAULT NULL,
  `actividad` varchar(255) DEFAULT NULL,
  `profesion` varchar(255) DEFAULT NULL,
  `pais` varchar(100) DEFAULT 'CL',
  `comuna` varchar(255) DEFAULT NULL,
  `recibir_mail` tinyint(1) DEFAULT 1,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `contactos`
--

INSERT INTO `contactos` (`id_contacto`, `nombre`, `email`, `telefono`, `rut`, `empresa`, `actividad`, `profesion`, `pais`, `comuna`, `recibir_mail`, `fecha_creado`, `fecha_modificado`) VALUES
(1, 'Juan Pérez Test 213', 'juan.perez@mail.cl', '+56932566198', '11111111-1', 'Empresa1', 'Marketing', 'Ingeniero', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-23 08:25:59'),
(2, 'María González', 'maria.gonzalez@mail.cl', '+56910000002', '22222222-2', 'Empresa2', 'Ventas', 'Analista', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(3, 'Pedro López', 'pedro.lopez@mail.cl', '+56910000003', '33333333-3', 'Empresa3', 'Desarrollo', 'Desarrollador', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(4, 'Ana Ramírez', 'ana.ramirez@mail.cl', '+56910000004', '44444444-4', 'Empresa4', 'Finanzas', 'Contador', 'CL', NULL, 0, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(5, 'Luis González', 'luis.gonzalez@mail.cl', '+56910000005', '55555555-5', 'Empresa5', 'RRHH', 'Administrador', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(6, 'Carla Martínez', 'carla.martinez@mail.cl', '+56910000006', '66666666-6', 'Empresa6', 'Diseño', 'Diseñador', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(7, 'Roberto Soto', 'roberto.soto@mail.cl', '+56910000007', '77777777-7', 'Empresa7', 'Marketing', 'Comunicador', 'CL', NULL, 0, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(8, 'Fernanda Vargas', 'fernanda.vargas@mail.cl', '+56910000008', '88888888-8', 'Empresa8', 'Salud', 'Nutricionista', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(9, 'Sebastián Torres', 'sebastian.torres@mail.cl', '+56910000009', '99999999-9', 'Empresa9', 'Educación', 'Profesor', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(10, 'Daniela Fuentes', 'daniela.fuentes@mail.cl', '+56910000010', '10101010-0', 'Empresa10', 'Medios', 'Periodista', 'CL', NULL, 0, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(11, 'Francisco Méndez', 'francisco.mendez@mail.cl', '+56910000011', '11112222-3', 'Empresa11', 'Desarrollo', 'Desarrollador', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(12, 'Valentina Rojas', 'valentina.rojas@mail.cl', '+56910000012', '12121212-4', 'Empresa12', 'Ventas', 'Ejecutivo', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(13, 'Alejandro Castro', 'alejandro.castro@mail.cl', '+56910000013', '13131313-5', 'Empresa13', 'Finanzas', 'Analista', 'CL', NULL, 0, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(14, 'Camila Paredes', 'camila.paredes@mail.cl', '+56910000014', '14141414-6', 'Empresa14', 'RRHH', 'Especialista', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(15, 'Joaquín Reyes', 'joaquin.reyes@mail.cl', '+56910000015', '15151515-7', 'Empresa15', 'Marketing', 'Community Manager', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(16, 'Isabel Gutiérrez', 'isabel.gutierrez@mail.cl', '+56910000016', '16161616-8', 'Empresa16', 'Diseño', 'UX Designer', 'CL', NULL, 0, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(20, 'Antonia Muñoz', 'antonia.munoz@mail.cl', '+56910000020', '20202020-2', 'Empresa20', 'Finanzas', 'CFO', 'CL', NULL, 1, '2025-07-09 05:01:12', '2025-08-26 07:47:18'),
(22, 'Jose Rubilar', 'jgrubiar@uc.cl', '56975555833', '19818738-0', 'Empresa Ejemplo S.A.', 'Tecnología', 'Ingeniero de Software', 'CL', NULL, 1, '2025-07-09 06:21:11', '2025-08-26 07:47:18'),
(23, 'Omar Rivero', 'omar.rivero@aicapital.cl', '56978548844', '16285649-9', 'Aicapital', 'Tecnología', 'Informatico', 'CU', NULL, 1, '2025-07-09 06:21:11', '2025-08-26 07:47:42'),
(27, 'JOSE Rubilar', 'jose@gmail.com', '923324544', '13630163-2', '', '', NULL, 'CL', NULL, 1, '2025-07-10 07:38:54', '2025-08-26 07:47:18'),
(28, 'Maike Yordan', 'jaja@asda.cl', '999887766', '8655062-8', '', '', NULL, 'CL', NULL, 1, '2025-07-10 07:42:59', '2025-08-26 07:47:18'),
(30, 'Michael Yordan', '', '932566198', '203616775', 'MINDSHOT SPA', NULL, NULL, 'CL', NULL, 1, '2025-08-14 00:32:44', '2025-08-26 07:47:18'),
(31, 'YORDAAN JASJA', 'lksjdsf@sadas.cl', '8282828', NULL, NULL, NULL, NULL, 'CL', NULL, 1, '2025-08-15 21:30:32', '2025-08-23 04:25:59'),
(33, 'Natalia Zapata', 'maikel@mindshot.cl', '92929292', NULL, NULL, NULL, NULL, 'CL', NULL, 1, '2025-08-19 02:39:55', '2025-08-23 04:25:59'),
(35, 'Usuario Prueba Ahora', 'usuario.prueba@gmail.com', '56999999999', '', '', '', '', 'CL', NULL, 1, '2025-08-21 22:54:16', '2025-08-26 07:47:18'),
(36, 'marion M.', 'mam@xtremosur.cl', '977484787', '65723875', NULL, NULL, NULL, 'CL', NULL, 1, '2025-08-23 19:09:01', '2025-08-26 07:47:18'),
(37, 'ANDREA URIBE', 'andrea.uribe@puertomontt.cl', '998736052', '', 'SI, participa', 'SI, habitacion sola', '', 'CL', 'PUERTO MONTT', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(38, 'ALEJANDRA BUSTOS', 'cultura@rionegrochile.cl', '950908336', '', 'SI, participa', 'si, hab doble', '', 'CL', 'RIO NEGRO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(39, 'ALVARO FACUSE', 'direccion.flordeagua@gmail.com', '982123421', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUERTO MONTT, FLOR DE AGUA ', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(40, 'AMANCAY WESSEL', 'claudia.wessel@ptovaras.cl', '926022940', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUERTO VARAS', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(41, 'CAROLA LEIVA', 'complejointerculturaldefresia@gmail.com', '996792135', '', 'SI, participa', 'si, hab doble', '', 'CL', 'FRESIA, COMPLEJO INTERCULTURAL DE FRESIA ', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(42, 'CRISTIAN MOREIRA', 'cristianmoreiravargas@gmail.com', '979975998', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUERTO OCTAY', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(43, 'DIEGO FUENZALIDA', 'casapauly@puertomontt.cl', '959790730', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUERTO MONTT, CASA PAULY', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(44, 'ELENA MONTIEL', 'direccion.arte@fundacionbosquenativo.cl', '', '', 'SI, participa', 'si, hab doble', '', 'CL', 'BOSQUE NATIVO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(45, 'GABRIEL BASTIDAS', 'cultura.dideco.fresia@gmail.com', '976400993', '', 'SI, participa', 'si, hab doble', '', 'CL', 'FRESIA', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(46, 'JOSE QUEUPUAN', 'asuntoswilliches@sanjuandelacosta.cl', '991656452', '', 'SI, participa', 'si, hab doble', '', 'CL', 'SAN JUAN DE LA COSTA', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(47, 'JUAN MANUEL PIZARRO', 'oficinadeculturahualaihue@gmail.com', '979899674', '', 'SI, participa', 'si, hab doble', '', 'CL', 'HUALAIHUE', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(48, 'MAIKEL SANDOVAL', 'maikel.info.calbuco@gmail.com', '962252491', '', 'SI, participa', 'si, hab doble', '', 'CL', 'CALBUCO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(49, 'MARIANA CARCAMO', 'marianacarcamoapp@gmail.com', '992604167', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUYEHUE', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(50, 'MARIO VILLARROEL', 'cultura@muermos.cl', '989861351', '', 'SI, participa', 'si, hab doble', '', 'CL', 'MUERMOS', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(51, 'NATHALY SANCHEZ', 'nsanchez@baj.cl', '977604814', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUERTO MONTT, BALMACEDA ARTE JOVEN', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(52, 'NELSA HENRIQUEZ', 'nelhevajo@hotmail.com', '950498990', '', 'SI, participa', 'si, hab doble', '', 'CL', 'OSORNO, SURAZO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(53, 'PAMELA URTUBIA', 'urtubia.pamela@gmail.com', '952130124', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUERTO MONTT, MUSEO DE PUERTO MONTT', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(54, 'SILVIA VERGARA', 'cultura@purranque.cl', '935676383', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PURRANQUE', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(55, 'SOLEDAD GUTIERREZ', 'solegutiga@gmail.com', '995702265', '', 'SI, participa', 'si, hab doble', '', 'CL', 'CALBUCO, CASA DE LA CULTURA CALBUCO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(56, 'VALENTINA SCHINDLER', 'gerencia@molinomachmar.cl', '938915468', '', 'SI, participa', 'si, hab doble', '', 'CL', 'PUERTO VARAS, CAMM', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(57, 'ALEJANDRO BARRIENTOS                 ', 'alejandrobarrientos@municipalidadcastro.cl', '952357880', '', 'SI, participa', 'consultar', '', 'CL', 'PROV CHILOE, CASTRO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(58, 'PAULA DELGADO', 'pdelgado@municipalidadcastro.cl', '944024706', '', 'SI, participa', 'consultar', '', 'CL', 'PROV CHILOE CASTRO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(59, 'PAOLA MORAGA', 'paola.moraga@ancudcultura.cl', '995008961', '', 'SI, participa', 'consultar', '', 'CL', 'PROV CHILOE ANCUD', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(60, 'NICOLAS ALVAREZ', 'nalvarez@municipalidadchonchi.cl', '940079437', '', 'SI, participa', 'consultar', '', 'CL', 'PROV CHILOE CHONCHI', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(61, 'PATRICIA GARCIA', 'patriciagarcia@curacodevelez.cl', '982551281', '', 'SI, participa', 'NO', '', 'CL', 'PROV CHILOE CURACO DE VELEZ', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(62, 'YASNA IGOR', 'yasna.igor@munidalcahue.cl', '961997811', '', 'SI, participa', 'consultar', '', 'CL', 'PROV CHILOE DALCAHUE', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(63, 'MONICA LEON', 'cultura@muniquellon.cl', '964237101', '', 'SI, participa', '', '', 'CL', 'PROV CHILOE QUELLON', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(64, 'YESSICA VILLEGAS', 'culturamuniquinchao@gmail.com', '957498227', '', 'SI, participa', 'consultar', '', 'CL', 'PROV CHILOE QUINCHAO', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(65, 'ALEJANDRO STUARDO', 'ver1@cultura.cl', '', '', 'SI, participa', 'NO', '', 'CL', 'RELATOR', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(66, 'ANA MARIA CERDA', 'ver2@cultura.cl', '', '', 'SI, participa', 'HABITACION INDIVIDUAL', '', 'CL', 'MINCAP', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(67, 'FERNANDO COSTA', 'ver3@cultura.cl', '995657150', '', 'SI, participa', 'NO', '', 'CL', 'RELATOR (CONSULTORA MERCA)', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(68, 'MARCELA ALVAREZ', 'ver4@cultura.cl', '', '', 'SI, participa', 'HABITACION INDIVIDUAL', '', 'CL', 'RELATOR', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(69, 'MAX RISCO', 'ver5@cultura.cl', '', '', 'SI, participa', 'HABITACION INDIVIDUAL', '', 'CL', 'MINCAP', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(70, 'NICOLE SALINAS', 'ver6@cultura.cl', '', '', 'SI, participa', 'HABITACION INDIVIDUAL', '', 'CL', 'RELATOR', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(71, 'PABLO FLORES', 'contacto@factoriacultural.cl', '986613124', '', 'SI, participa', 'HABITACION INDIVIDUAL', '', 'CL', 'RELATOR (CONSULTORA FACTORIA CULTURAL)', 1, '2025-08-25 01:07:18', '2025-08-26 07:47:18'),
(72, 'Alvaro González', 'alvaro.gonzalez@acepta.com', '2714 9590', '', 'KR CONSULTING LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(73, 'Ricardo Herrera Quiroz', 'rherrera@adelanta.cl', '2335 4642', '', 'ASESORIAS Y CONSULTORÍAS EN INFORMATICA LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(74, 'Carlos Busso', 'cbusso@adexus.cl', '2686 1000', '', 'LEBOX TECNOLOGÍA LTDA', 'Presidente Ejecutivo', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(75, 'Federico Meny', 'fmeny@adistec.com', '2896 4600', '', 'LENOVO AGENCIA EN CHILE', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(76, 'Paulina Cañas Urrutia', 'paulina.canas@agile.cl', '32-212 4822', '', 'LEVEL 3 CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(77, 'Cristián Osorio', 'cristian.osorio@intercapit.com', '2599 7199', '', 'LIFEWARE S.A.C.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(78, 'Fernando Martínez', 'marcos.estrella@aiep.cl', '2570 4000', '', 'MCAFEE CHILE S.A.', 'Rector', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(79, 'José Guerrero Cáceres', 'jguerrero@americaveintiuno.cl', '2671 9115', '', 'MICROSOFT CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(80, 'Priscila Arruda', 'Priscila.Arruda@americantower.com', '2618 7800', '', 'MICROSYSTEMS S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(81, 'Adolfo Tassara Espinoza', 'ate@anida.cl', '2591 9900', '', 'METALÚRGICA Y MECÁNICAS MIDAS LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(82, 'Enrique Morales Núñez', 'emorales@as-asoc.cl', '2829 7300', '', 'MORPHO S.A. ', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(83, 'Benhel Sarce', 'benhel.sarce@atos.net', '2340 5416', '', 'NCR CHILE LTDA.', 'Sales Director', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(84, 'Emilio Deik Morrison ', 'edeik@azurian.com', '2620 2020', '', 'NETSECURE INFORMATICA S.A. ', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(85, 'Gabriel Calgaro', 'gcalgaro@cisco.com', '2431 4900', '', 'MANRÍQUEZ Y COMPAÑÍA LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(86, 'Felipe Vidal Celsi', 'fvidal@citymovil.cl', '2940 4300', '', 'NEXTEL S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(87, 'Drago Eterovic Sudy', 'daeterovic@cmetrixit.com', '2889 9100', '', 'NOVARED CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(88, 'Drago Eterovic Sudy', 'dragoe@cmetrixit.com', '2889 9100', '', 'NOVARED CHILE S.A.', 'CEO', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(89, 'Raúl Ciudad de la Cruz', 'rciudad@coasin.cl', '2410 8020', '', 'NOVASTOR S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(90, 'Ramón Heredia', 'ramon.heredia@componenteserviex.com', '2719 1700', '', 'NUBISON SPA', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(91, 'Carlos A. Riccialdelli', 'ematamal@consist.cl', '2234 3593', '', 'NUBOX', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(92, 'Rodrigo Carvallo Portales', 'rcarvallo@beyond.cl', '2236 9233', '', 'OPTIMISA S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(93, 'Rodrigo Vallarino ', 'rvallarino@datanetsa.com', '2373 4000', '', 'ORACLE DE CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(94, 'Víctor Cabrera Gaillard', 'victor.cabrera@dbnetcorp.com', '2584 7800', '', 'E-PARTNERS S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(95, 'Mauricio Chacón', 'mauricio_chacon@dell.com', '2685 6800', '', 'PINK ELEPHANT S.A. DE C.V. AGENCIA EN CHILE', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(96, 'Rolando Rojas Saavedra', 'rolando.rojas@desis.cl', '2947 2800', '', 'CONSULTORÍAS PLEYASOFT LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(97, 'Jairo Ochoa', 'jairo.ochoa@dimensiondata.com', '2240 8100', '', 'PLUS EMPRESA CONSULTORA LTDA. ', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(98, 'David Vargas Núñez ', 'david.vargas@duam.cl', '2635 4409', '', 'POWERDATA AMERICA LIMITADA ', 'Director de Escuela', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(99, 'Roberto Barriga', 'rbarriga@duoc.cl', '2354 0445', '', 'PROVECTIS S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(100, 'Fernando Allendes B.', 'fernano.allendes@ecm.cl', '2655 5500', '', 'COMERCIAL CALDERA Y NÚÑEZ LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(101, 'Gilbert  E. Leiva Angulo', 'gilbert.leiva@educaciondigitalsa.com', '2718 9500', '', 'RED COMERCIO S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(102, 'Edmundo Barrientos Palma', 'edmundo@educamundo.cl', '2233 5191', '', 'RED HAT CHILE LIMITADA', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(103, 'Guillermo Díaz-Vaz', 'gdiazvaz@elpa.cl', '2413 1000', '', 'RED UNIVERSITARIA NACIONAL ', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(104, 'Daniel Wilner', 'daniel.wilner@elogos.cl', '2595 4700', '', 'SAFEHIS SPA', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(105, 'Guillermo Moya Peña', 'guillermo.moya@emc.com', '2373 3100', '', 'SAP AGENCIA EN CHILE', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(106, 'Roberto Riveros', 'rriveros@enable.cl', '2651 2900', '', 'SOCIEDAD DE INGENIERÍA E INFORMÁTICA SAYDEX LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(107, 'Antonio Bücchi Buc', 'antoniobbuc@entel.cl', '2360 0123', '', 'SCM CONSULTORES S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(108, 'Antonio Bücchi Buc', 'ggeneral@entel.cl', '2360 0123', '', 'SCM CONSULTORES S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(109, 'Nicolás Brancoli', 'nicolas.brancoli@ericsson.com', '2372 5397', '', 'SEGACY SPA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(110, 'Cristián Lefevre', 'angelica.farias@cl.ey.com', '2676 1000', '', 'SEIDOR TECHNOLOGIES EX SNOOP CONSULTING S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(111, 'Andrés Cave Valderrama', 'acave@esign-la.com', '2433 1501', '', 'SIXTRA CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(112, 'Sergio Burdiles', 'sburdiles@eticsa.cl', '2783 2000', '', 'SOAINT GESTIÓN S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(113, 'Jaime Jankelevich W.', 'jjankelevich@etika.cl', '2232 3524', '', 'SOCIAL Y DIGITAL IDEAS SPA', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(114, 'Mauricio Ríos ', 'mauricio.rios@everis.com', '2421 5350', '', 'SOFTGROUP SERVICIOS COMPUTACIONALES LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(115, 'Andrey Luján', 'alujan@ewin.cl', '2953 6731', '', 'SOLUCIONES EXPERTAS S.A.', '', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(116, 'Carlos Aguiar Desormeaux', 'caguiar@extensionsa.com', '2449 9000', '', 'ORIÓN 2000 S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(117, 'Jaime Soto Muñoz', 'jsoto@genbiz.cl', '2639 0471', '', 'SONDA S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(118, 'Francisco Murillo Ortega ', 'fmurillo@gestsol.cl', '2207 2398', '', 'SOUTHERN TECHNOLOGY GROUP LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(119, 'Fernando López Iervasi ', 'fiervasi@google.com', '2 6187100', '', 'ST COMPUTACIÓN S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(120, 'Leonardo Marty', 'leonardo.marty@quanam.com', '2650 8303', '', 'STACKS SERVICIOS TECNOLÓGICOS S.L. CHILE LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(121, 'Eduardo Castillo', 'susanadiaz@gs1chile.org', '2365 4070', '', 'SWITCH COMUNICACIONES LTDA.', 'HP Managing Director', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(122, 'Jaime Vio Varela', 'jvio@gtschile.com', '2244 8558', '', 'SYA CONSULTORES ASOCIADOS CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(123, 'Edgar Witt', 'edgar.witt@hp.com', '2290 3300', '', 'SYNAPSIS SPA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(124, 'Ernesto Pérez Urrutia ', 'eperez@hexa.cl', '32-2288 8954', '', 'SYNOPSYS CHILE LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(125, 'Luis Peña ', 'luis.pena@hiway.cl', '2940 7500', '', 'TECHNICOLOR CHILE SA.', 'CEO', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(126, 'Cristián Alfredo Casamayor Sepúlveda', 'cristian@hosting.cl', '2411 0300', '', 'TECNOCOM CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(127, 'Alfono Nistal López', 'anistal@iasaf.com', '2750 1950', '', 'FORMACIÓN EN TECNOLOGÍAS DE INFORMACIÓN SPA', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(128, 'Martin Naor Costa', 'martin@infocorpgroup.com', '2441 0410', '', 'TELEFÓNICA EMPRESAS  CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(129, 'Kennya Estrella Lozada', 'k.estrella@iconnect.cl', '2954 1746', '', 'TELVENT CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(130, 'Gustavo Montero ', 'gmontero@imaginex.cl', '2480 9015-16', '', 'TINET SOLUCIONES INFORMATICAS S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(131, 'Víctor Hugo Gavidia', 'vgavidia@impresionuno.cl', '2443 2400 ', '', 'TOC S.A.', 'Rector', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(132, 'Pablo Moreno Pérez', 'pmoreno@inmotion.cl', '2431 6400', '', 'TUXPAN SOFTWARE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(133, 'Gonzalo Vargas Otte ', 'gvargas@inacap.cl', '2429 8150', '', 'UPGRADE CHILE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(134, 'Víctor Hugo Espinoza Rodríguez', 'vhespinoza@indracompany.com', '2810 3600 - 2810 3650', '', 'VIDEOTEK SEGURIDAD LTDA.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(135, 'Mojca Sirok ', 'msirok@ingeniaglobal.cl', '26537000', '', 'VIGATEC S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(136, 'Rubén Darío Ulloa Vilarín', 'rulloa@insico.cl', '2498 7777', '', 'VISIONWAVES LATAM SPA', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(137, 'Laurentzi de Sasia', 'laurentzi.sasia@intel.com', '2582 7100', '', 'WAYPOINT TELECOMUNICACIONES S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(138, 'Luis Toro Lobos ', 'luis.toro@grupointellego.com', '56 (2)  24287307', '', 'WIDEFENSE S.A.', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(139, 'Rodrigo Pizarro Elissegaray', 'rpizarro@internexa.com', '2954 9732', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(140, 'Carlos Nogueira', 'carlos.nogueira@intersystems.com', '2892 6000', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(141, 'Abdel Sheja Seleme', 'asheja@intesis.cl', '271336609', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(142, 'Iván Toro Olavarría', 'ivan.toro@itqlatam.com', '2695 0645', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(143, 'Mario Araya Rivas ', 'maraya@kibernum.com', '2816 3500', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(144, 'Luis Kreither Olivares', 'lkreither@krconsulting.cl', '2938 4800', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(145, 'Ricardo Muñoz Monge ', 'rmunoz@latinshare.biz', '6-877 4399', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(146, 'Cristián Hoffmann Ocaranza', 'choffmann@lebox.com', '2225 1942', '', '', 'VicePresidente', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(147, 'Daniel Acosta', 'dacosta@lenovo.com', '2584 6900 - 2584 6925', '', '', '', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(148, 'David Iacobucci', 'david.iacobucci@level3.com', '2422 5900', '', '', ' ', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(149, 'Mario Ogalde Julio ', 'gerencia@lifeware.cl', '32-269 6962', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(150, 'Juan Manuel Spoerer', 'juan_spoerer@mcafee.com', '2389 6000', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(151, 'Oliver Flögel', 'oflogel@microsoft.com', '2330 6000', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(152, 'Nicolás Andalaf ', 'nandalaft@microsystem.cl', '2460 6400', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(153, 'Andrés Saldías Meza', 'asaldias@midaschile.cl', '2747 1487', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(154, 'Alfonso Viveros Casanova ', 'alfonso.viveros@morpho.com', '2433 9390', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(155, 'Jorge Belmar Hoyos', 'jorge.belmar@ncr.com', '2687 1000', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(156, 'Giovani Becerra', 'gbecerra@netsecure.cl', '2584 9501', '', '', 'Presidente', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(157, 'Felipe Manríquez', 'fmanriquez@neuronet.cl', '2236 1312', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(158, 'Estanislao Peña', 'estanislao.pena@nextel.cl', '2337 7500 -2674 1232', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(159, 'Miguel Pérez Arata', 'mperez@novared.net', '2499 9000', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(160, 'Mauricio Peña González', 'mauricio@daibackup.cl', '22877079', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(161, 'Carlos Teixidó Palacios', 'cteixido@nubison.cl', '2234 9824', '', '', 'Presidente', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(162, 'Marcos Mahave Cáceres', 'marcos.mahave@nubox.com', '2478 5000', '', '', 'Country Manager', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(163, 'Alfredo Piquer Gardner', 'apiquer@optimisa.cl', '2335 8241', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(164, 'Rodrigo Astorga', 'rodrigo.astorga@oracle.com', '2666 5110', '', '', 'Gerente  Cono Sur', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(165, 'Alfredo Guardiola', 'aguardiola@paperlessla.com', '2589 5400', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(166, 'Luis Sandoval Urquizar', 'l.sandoval@pinkelephant.com', '2594 7521', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(167, 'Alfredo Perea Fernández', 'alfredo.perea@pleyasoft.com', '2223 1198', '', '', 'Gerente General / Operaciones / Marketing', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(168, 'Roberto Santa María Koch', 'rsantamaria@plus.cl', '2231 0111', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(169, 'Patricio Alvarez', 'palvarez@powerdata.cl', '2936 3100', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(170, 'Juan Carlos Macuada Cortés', 'juan.macuada@provectis.cl', '2431 5900', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(171, 'Pablo Caldera', 'pablo.caldera@quintavia.cl', '2264 9685', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(172, 'Asper Sarras Letelier', 'asper.sarras@chequecompra.cl', '2381 8701', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(173, 'Ezequiel Picardo', 'epicardo@redhat.com', '2364 4423', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(174, 'Paola Arellano Toro', 'parellan@reuna.cl', '2337 0300', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(175, 'Francisco Cabello Palma', 'francisco.cabello@safehis.com', '2247 4691', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(176, 'Leonel Graff', 'leonel.graff@sap.com', '2440 3500', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(177, 'Juan Rodríguez', 'jrodriguez@saydex.cl', '2588 8800', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(178, 'Miguel Alfaro González ', 'malfaro@scmconsultores.cl', '2246 9178', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(179, 'Miroslav Pavlovic', 'mpavlovic@segacy.com', '2431 5308', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(180, 'Pablo Hugo Berro', 'pablo.berro@seidor.cl', '2233 5498', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(181, 'Pablo Pumarino', 'pablo.pumarino@sixbell.com', '2200 1200', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(182, 'Francisco Méndez Sanhueza', 'fmendez@soaint.cl', '2638 4921', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(183, 'Fan Liao', 'fliao@visitaganadora.cl', '2412 1323', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(184, 'Juan Ocqueteau Campos', 'jocqueteau@softgroup.cl', '2469 2057', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(185, 'Jorge Hoyl Moreno', 'jorge.hoyl@solex.cl', '2923 2900', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(186, 'Andrés Cargill', 'andres.cargill@solucionesorion.com', '2640 3900', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(187, 'Raúl Véjar Olea', 'raul.vejar@sonda.com', '657 5103', '', '', 'Director Ejecutivo', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(188, 'Carolina Vásquez Ugarte', 'carolina.vasquez@stgchile.cl', '392 5000', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(189, 'José Pedro Torres Díaz', 'josepedro.torres@st-computacion.com', '2372 3200', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(190, 'Francisco Ríos', 'frios@stacks.cl', '2333 4669', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(191, 'José Miguel Covarrubias Larraín', 'hcovarrubias@switch.cl', '2299 9999', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(192, 'Edward Seleme', 'eseleme@syachile.cl', '2940 1500', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(193, 'Leonardo Covalschi', 'lcovalschi@synapsis-it.com', '2397 6900', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(194, 'Víctor Grimblatt', 'victor.grimblatt@synopsys.com', '2714 6815', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(195, 'Juan Sosa Godina', 'juan.sosa@technicolor.com', '2769 8082', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(196, 'Enrique Placed Castro', 'enrique.placed@tecnocom.biz', '2577 3200', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(197, 'Cristián López Figueroa', 'cristian.lopez@tecnoforchile.cl', '2905 1585 - 2584 8152', '', '', 'Gte Gral Telefonica Chile SA', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(198, 'Juan Muñoz Tapia', 'jmunozt@stafftp.com', '2601 4561', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(199, 'Rafael Zamora Sanhueza / César Valdés', 'rafael.zamora@telefonica.com', '2691 3281', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(200, 'Ledda Vega Alfaro', 'ledda.vega@telvent.cl', '2925 7400', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(201, 'Feiz Jodor Hereme ', 'feiz@tinet.cl', '2663 6600', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(202, 'Ricrdo Navarro Luft', 'ricardo.navarro@toc.cl', '2946 5753', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(203, 'Carlos Durán Sepúlveda', 'cardura@tuxpan.com', '32-268 0906', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(204, 'Roberto Inzunza Barrios ', 'rinzunza@upgrade.cl', '22670 1200', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(205, 'Aldo Vera Muñoz', 'aldo@tepille.cl', '2571 0900', '', '', '', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(206, 'Guillermo Weschler Berstein', 'gweschler@vigatec.cl', '2350 7000', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(207, 'Fernando Pérez Suárez', 'f.perez@visionwaves.com', '2378 3483', '', '', 'Gerente General', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(208, 'Gonzalo Fuenzalida Zegers', 'gfuenzalida@waypoint.cl', '2963 4180', '', '', '', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18'),
(209, 'Kenneth Daniels', 'kdaniels@widefense.com', '2816 9000', '', '', '', '', 'CL', '', 1, '2025-08-26 04:40:20', '2025-08-26 07:47:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contactos_por_base`
--

CREATE TABLE `contactos_por_base` (
  `id_contacto` int(11) NOT NULL,
  `id_base` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `contactos_por_base`
--

INSERT INTO `contactos_por_base` (`id_contacto`, `id_base`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(37, 8),
(38, 8),
(39, 8),
(40, 8),
(41, 8),
(42, 8),
(43, 8),
(44, 8),
(45, 8),
(46, 8),
(47, 8),
(48, 8),
(49, 8),
(50, 8),
(51, 8),
(52, 8),
(53, 8),
(54, 8),
(55, 8),
(56, 8),
(57, 8),
(58, 8),
(59, 8),
(60, 8),
(61, 8),
(62, 8),
(63, 8),
(64, 8),
(65, 8),
(66, 8),
(67, 8),
(68, 8),
(69, 8),
(70, 8),
(71, 8),
(72, 9),
(73, 9),
(74, 9),
(75, 9),
(76, 9),
(77, 9),
(78, 9),
(79, 9),
(80, 9),
(81, 9),
(82, 9),
(83, 9),
(84, 9),
(85, 9),
(86, 9),
(87, 9),
(88, 9),
(89, 9),
(90, 9),
(91, 9),
(92, 9),
(93, 9),
(94, 9),
(95, 9),
(96, 9),
(97, 9),
(98, 9),
(99, 9),
(100, 9),
(101, 9),
(102, 9),
(103, 9),
(104, 9),
(105, 9),
(106, 9),
(107, 9),
(108, 9),
(109, 9),
(110, 9),
(111, 9),
(112, 9),
(113, 9),
(114, 9),
(115, 9),
(116, 9),
(117, 9),
(118, 9),
(119, 9),
(120, 9),
(121, 9),
(122, 9),
(123, 9),
(124, 9),
(125, 9),
(126, 9),
(127, 9),
(128, 9),
(129, 9),
(130, 9),
(131, 9),
(132, 9),
(133, 9),
(134, 9),
(135, 9),
(136, 9),
(137, 9),
(138, 9),
(139, 9),
(140, 9),
(141, 9),
(142, 9),
(143, 9),
(144, 9),
(145, 9),
(146, 9),
(147, 9),
(148, 9),
(149, 9),
(150, 9),
(151, 9),
(152, 9),
(153, 9),
(154, 9),
(155, 9),
(156, 9),
(157, 9),
(158, 9),
(159, 9),
(160, 9),
(161, 9),
(162, 9),
(163, 9),
(164, 9),
(165, 9),
(166, 9),
(167, 9),
(168, 9),
(169, 9),
(170, 9),
(171, 9),
(172, 9),
(173, 9),
(174, 9),
(175, 9),
(176, 9),
(177, 9),
(178, 9),
(179, 9),
(180, 9),
(181, 9),
(182, 9),
(183, 9),
(184, 9),
(185, 9),
(186, 9),
(187, 9),
(188, 9),
(189, 9),
(190, 9),
(191, 9),
(192, 9),
(193, 9),
(194, 9),
(195, 9),
(196, 9),
(197, 9),
(198, 9),
(199, 9),
(200, 9),
(201, 9),
(202, 9),
(203, 9),
(204, 9),
(205, 9),
(206, 9),
(207, 9),
(208, 9),
(209, 9);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id_evento` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `ciudad` varchar(255) NOT NULL,
  `lugar` varchar(255) NOT NULL,
  `presupuesto_marketing` decimal(15,2) DEFAULT NULL,
  `estado` int(11) NOT NULL DEFAULT 1,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id_evento`, `nombre`, `fecha_inicio`, `fecha_fin`, `ciudad`, `lugar`, `presupuesto_marketing`, `estado`, `fecha_creado`, `fecha_modificado`) VALUES
(17, 'Muni de Pudahuel - Dia dirigente social_sep25', '2025-09-05 00:00:00', '2025-09-06 00:00:00', 'Santiago', 'Los Buenos Muchachos', 66000000.00, 2, '2025-08-20 04:38:43', '2025-08-20 11:54:37'),
(18, 'MMA - Simposio Cambio climatico_oct25', '2025-10-07 00:00:00', '2025-10-09 00:00:00', 'Valparaiso', 'Universidad Santa Maria', 18000000.00, 2, '2025-08-20 12:00:47', '2025-08-20 12:03:03'),
(19, 'MINCAP - Seminarios Castro y Pto Montt', '2025-08-27 00:00:00', '2025-08-29 00:00:00', 'Castro y Pto. Montt', 'Hotel Diego de Almagro', 18000000.00, 1, '2025-08-20 12:07:32', '2025-08-22 04:46:02'),
(20, 'Muni de Chiguayante', '2025-08-14 00:00:00', '2025-08-15 00:00:00', 'Chiguayante', 'Estadio Español', 17000000.00, 3, '2025-08-20 12:09:16', '2025-08-20 12:09:58'),
(21, 'City Lab', '2025-10-07 00:00:00', '2025-10-09 00:00:00', 'Concepcion', 'Teatro regional', 3400000.00, 2, '2025-08-20 12:12:06', '2025-08-20 12:12:41'),
(22, 'Muni de Pudahuel Dia ddel funcionario', '2025-11-05 00:00:00', '2025-11-06 00:00:00', 'Santiago', 'Los Buenos Muchachos', 0.00, 1, '2025-08-23 02:48:44', '2025-08-25 14:06:27'),
(23, 'Muni Talcahuano', '2025-08-21 00:00:00', '2025-08-22 00:00:00', 'Talcahuano', 'Tortuga, Palacio del deporte', 0.00, 1, '2025-08-23 02:55:49', '2025-08-23 02:55:49'),
(24, 'Muni San Pedro de la paz - Dia dirigente social ago25', '2025-08-28 00:00:00', '2025-08-29 00:00:00', 'Concepcion', 'Restaurant, La parrilla de Don Talo', 0.00, 1, '2025-08-26 04:09:15', '2025-08-26 04:09:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evento_archivos`
--

CREATE TABLE `evento_archivos` (
  `id_archivo` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `nombre_original` varchar(255) NOT NULL,
  `nombre_guardado` varchar(255) NOT NULL,
  `ruta_almacenamiento` varchar(255) NOT NULL,
  `tipo_mime` varchar(100) NOT NULL,
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `evento_archivos`
--

INSERT INTO `evento_archivos` (`id_archivo`, `id_evento`, `nombre_original`, `nombre_guardado`, `ruta_almacenamiento`, `tipo_mime`, `fecha_subida`) VALUES
(6, 19, 'NÃ³mina actualizada Agosto 2025(1).xlsx', 'evento-1756299259423-308008784.xlsx', '/eventos/19/', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '2025-08-27 12:54:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `formulario_campos`
--

CREATE TABLE `formulario_campos` (
  `id_campo` int(11) NOT NULL,
  `nombre_interno` varchar(100) NOT NULL,
  `etiqueta` varchar(255) NOT NULL,
  `tipo_campo` enum('TEXTO_CORTO','PARRAFO','SELECCION_UNICA','CASILLAS','DESPLEGABLE','ARCHIVO') NOT NULL,
  `es_de_sistema` tinyint(1) NOT NULL DEFAULT 0,
  `es_fijo` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el campo no puede ser desactivado (ej. nombre, email)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `formulario_campos`
--

INSERT INTO `formulario_campos` (`id_campo`, `nombre_interno`, `etiqueta`, `tipo_campo`, `es_de_sistema`, `es_fijo`) VALUES
(1, 'nombre', 'Nombre', 'TEXTO_CORTO', 1, 1),
(3, 'email', 'Email', 'TEXTO_CORTO', 1, 1),
(4, 'telefono', 'Teléfono', 'TEXTO_CORTO', 1, 1),
(5, 'rut', 'RUT / Identificación', 'TEXTO_CORTO', 1, 0),
(6, 'empresa', 'Empresa', 'TEXTO_CORTO', 1, 0),
(7, 'actividad', 'Actividad o Sector', 'TEXTO_CORTO', 1, 0),
(8, 'profesion', 'Profesión o Cargo', 'TEXTO_CORTO', 1, 0),
(9, 'pais', 'País', 'TEXTO_CORTO', 1, 1),
(10, 'comuna', 'Comuna', 'TEXTO_CORTO', 1, 0),
(14, 'custom_nombre_mama_1755202016207', 'nombre mama', 'PARRAFO', 0, 0),
(29, 'custom_sexo_1755203206432', 'Sexo', 'SELECCION_UNICA', 0, 0),
(30, 'custom_hola_1755203259850', 'hola', 'CASILLAS', 0, 0),
(50, 'custom_foto_1755816185051', 'Foto', 'ARCHIVO', 0, 0),
(51, 'habitacion_hotel_personalizado-175612', 'Habitación hotel', 'SELECCION_UNICA', 0, 0),
(52, 'gastronomia_personalizado-175615', 'Gastronomia', 'SELECCION_UNICA', 0, 0),
(53, 'custom_habitacion_hotel_1756143617686', 'Habitacion hotel', 'SELECCION_UNICA', 0, 0),
(54, 'gastronomia', 'Gastronomia', 'SELECCION_UNICA', 0, 0),
(57, 'custom_nro_habitacion_1756251973574', 'Nro habitacion', 'TEXTO_CORTO', 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripciones`
--

CREATE TABLE `inscripciones` (
  `id_inscripcion` int(11) NOT NULL,
  `id_campana` int(11) NOT NULL,
  `id_contacto` int(11) NOT NULL,
  `id_tipo_entrada` int(11) DEFAULT NULL,
  `estado_asistencia` enum('Invitado','Abrio Email','Registrado','Confirmado','Por Confirmar','No Asiste','Asistió','Cancelado') NOT NULL,
  `estado_pago` enum('No Aplica','Pendiente','Pagado','Rechazado','Reembolsado') NOT NULL,
  `codigo_qr` varchar(255) DEFAULT NULL,
  `nota` text DEFAULT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inscripciones`
--

INSERT INTO `inscripciones` (`id_inscripcion`, `id_campana`, `id_contacto`, `id_tipo_entrada`, `estado_asistencia`, `estado_pago`, `codigo_qr`, `nota`, `fecha_inscripcion`) VALUES
(88, 13, 37, NULL, 'Confirmado', 'No Aplica', NULL, 'solicita habitación sola', '2025-08-25 02:15:44'),
(89, 13, 38, NULL, 'Confirmado', 'No Aplica', NULL, '', '2025-08-25 02:15:44'),
(90, 13, 39, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(91, 13, 40, NULL, 'Confirmado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(92, 13, 41, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(93, 13, 42, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(94, 13, 43, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(95, 13, 44, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(96, 13, 45, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(97, 13, 46, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(98, 13, 47, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(99, 13, 48, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(100, 13, 49, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(101, 13, 50, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(102, 13, 51, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(103, 13, 52, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(104, 13, 53, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(105, 13, 54, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(106, 13, 55, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(107, 13, 56, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(108, 13, 57, NULL, 'Confirmado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(109, 13, 58, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(110, 13, 59, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(111, 13, 60, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(112, 13, 61, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(113, 13, 62, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(114, 13, 63, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(115, 13, 64, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(116, 13, 65, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(117, 13, 66, NULL, 'Confirmado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(118, 13, 67, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(119, 13, 68, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(120, 13, 69, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(121, 13, 70, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44'),
(122, 13, 71, NULL, 'Registrado', 'No Aplica', NULL, NULL, '2025-08-25 02:15:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripcion_respuestas`
--

CREATE TABLE `inscripcion_respuestas` (
  `id_respuesta` int(11) NOT NULL,
  `id_inscripcion` int(11) NOT NULL,
  `id_campo` int(11) NOT NULL,
  `valor` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inscripcion_respuestas`
--

INSERT INTO `inscripcion_respuestas` (`id_respuesta`, `id_inscripcion`, `id_campo`, `valor`) VALUES
(64, 88, 51, 'Single'),
(65, 88, 52, 'Normal'),
(72, 88, 57, '24');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL,
  `id_inscripcion` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `moneda` varchar(5) NOT NULL DEFAULT 'CLP',
  `estado` enum('Pendiente','Pagado','Fallido','Anulado') NOT NULL DEFAULT 'Pendiente',
  `orden_compra` varchar(255) NOT NULL,
  `token_flow` varchar(255) DEFAULT NULL,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subeventos`
--

CREATE TABLE `subeventos` (
  `id_subevento` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `ciudad` varchar(255) DEFAULT NULL,
  `lugar` varchar(255) DEFAULT NULL,
  `link_adicional` text DEFAULT NULL,
  `texto_libre` text DEFAULT NULL,
  `nombre_evento_mailing` varchar(255) DEFAULT NULL,
  `fecha_hora_mailing` datetime DEFAULT NULL,
  `asunto_mailing` varchar(255) DEFAULT NULL,
  `remitente_mailing` varchar(255) DEFAULT NULL,
  `ruta_texto_mailing` varchar(255) DEFAULT NULL,
  `ruta_imagen_mailing` varchar(255) DEFAULT NULL,
  `ruta_formulario` varchar(255) DEFAULT NULL,
  `sitio_web` varchar(255) DEFAULT NULL,
  `obligatorio_registro` tinyint(1) NOT NULL DEFAULT 0,
  `obligatorio_pago` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `subeventos`
--

INSERT INTO `subeventos` (`id_subevento`, `id_evento`, `nombre`, `fecha_inicio`, `fecha_fin`, `ciudad`, `lugar`, `link_adicional`, `texto_libre`, `nombre_evento_mailing`, `fecha_hora_mailing`, `asunto_mailing`, `remitente_mailing`, `ruta_texto_mailing`, `ruta_imagen_mailing`, `ruta_formulario`, `sitio_web`, `obligatorio_registro`, `obligatorio_pago`, `fecha_creado`, `fecha_modificado`) VALUES
(38, 19, 'Seminario en Castro', '2025-08-27 00:00:00', '2025-08-29 00:00:00', 'Castro', 'Hotel Diego de Almagro', NULL, '', '', NULL, '', '', '', '', '', NULL, 1, 0, '2025-08-21 23:25:25', '2025-08-22 05:18:27'),
(40, 19, 'Seminario en Puerto Montt', '2025-09-17 00:00:00', '2025-09-25 00:00:00', 'Puerto Montt', 'Hotel x ver', NULL, '', '', NULL, '', '', '', '', '', NULL, 0, 0, '2025-08-22 05:20:07', '2025-08-22 05:20:07');

--
-- Disparadores `subeventos`
--
DELIMITER $$
CREATE TRIGGER `after_subevento_update_registro` AFTER UPDATE ON `subeventos` FOR EACH ROW BEGIN
    -- Escenario 1: El registro ahora es OBLIGATORIO (antes no lo era)
    IF OLD.obligatorio_registro = 0 AND NEW.obligatorio_registro = 1 THEN
        -- Cambia a los 'Invitados' a 'Registrado' para que deban confirmar
        UPDATE inscripciones i
        JOIN campanas c ON i.id_campana = c.id_campana
        SET i.estado_asistencia = 'Registrado'
        WHERE c.id_subevento = NEW.id_subevento AND i.estado_asistencia = 'Invitado';

    -- Escenario 2: El registro ahora es OPCIONAL (antes era obligatorio)
    ELSEIF OLD.obligatorio_registro = 1 AND NEW.obligatorio_registro = 0 THEN
        -- Cambia solo a los 'Registrados' (pendientes) a 'Invitado'
        UPDATE inscripciones i
        JOIN campanas c ON i.id_campana = c.id_campana
        SET i.estado_asistencia = 'Invitado'
        WHERE c.id_subevento = NEW.id_subevento AND i.estado_asistencia = 'Registrado';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_de_entrada`
--

CREATE TABLE `tipos_de_entrada` (
  `id_tipo_entrada` int(11) NOT NULL,
  `id_campana` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cantidad_total` int(11) DEFAULT NULL,
  `cantidad_vendida` int(11) NOT NULL DEFAULT 0,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_refresh_tokens`
--

CREATE TABLE `user_refresh_tokens` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `user_refresh_tokens`
--

INSERT INTO `user_refresh_tokens` (`id`, `id_usuario`, `token`, `expires_at`, `created_at`) VALUES
(538, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxLCJpYXQiOjE3NTYzMjI3OTgsImV4cCI6MTc1NjkyNzU5OH0.HZemhGVRbnaG7UjrKnzTaygn-kwnhKBG4hLB67W9BSo', '2025-09-03 19:26:38', '2025-08-27 19:26:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password`, `fecha_creado`) VALUES
(1, 'Usuario Prueba', 'test@example.com', '$2a$12$PSrkhz7NV8ymaSTy0TsENOleGHzt6pdq4Bb7o09Y4lcGdy5OUUFJ6', '2025-07-09 04:30:32');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bases_de_datos`
--
ALTER TABLE `bases_de_datos`
  ADD PRIMARY KEY (`id_base`);

--
-- Indices de la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD PRIMARY KEY (`id_campana`),
  ADD UNIQUE KEY `url_amigable` (`url_amigable`),
  ADD KEY `id_evento` (`id_evento`),
  ADD KEY `id_subevento` (`id_subevento`);

--
-- Indices de la tabla `campana_formulario_config`
--
ALTER TABLE `campana_formulario_config`
  ADD PRIMARY KEY (`id_config`),
  ADD UNIQUE KEY `idx_campana_campo` (`id_campana`,`id_campo`),
  ADD KEY `fk_config_campana` (`id_campana`),
  ADD KEY `fk_config_campo` (`id_campo`);

--
-- Indices de la tabla `campo_opciones`
--
ALTER TABLE `campo_opciones`
  ADD PRIMARY KEY (`id_opcion`),
  ADD KEY `fk_opcion_campo` (`id_campo`);

--
-- Indices de la tabla `contactos`
--
ALTER TABLE `contactos`
  ADD PRIMARY KEY (`id_contacto`);

--
-- Indices de la tabla `contactos_por_base`
--
ALTER TABLE `contactos_por_base`
  ADD PRIMARY KEY (`id_contacto`,`id_base`),
  ADD KEY `id_base` (`id_base`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id_evento`);

--
-- Indices de la tabla `evento_archivos`
--
ALTER TABLE `evento_archivos`
  ADD PRIMARY KEY (`id_archivo`),
  ADD KEY `idx_id_evento` (`id_evento`);

--
-- Indices de la tabla `formulario_campos`
--
ALTER TABLE `formulario_campos`
  ADD PRIMARY KEY (`id_campo`),
  ADD UNIQUE KEY `idx_nombre_interno` (`nombre_interno`);

--
-- Indices de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD PRIMARY KEY (`id_inscripcion`),
  ADD UNIQUE KEY `idx_campana_contacto` (`id_campana`,`id_contacto`),
  ADD UNIQUE KEY `codigo_qr` (`codigo_qr`),
  ADD KEY `id_contacto` (`id_contacto`),
  ADD KEY `id_tipo_entrada` (`id_tipo_entrada`),
  ADD KEY `id_campana` (`id_campana`) USING BTREE;

--
-- Indices de la tabla `inscripcion_respuestas`
--
ALTER TABLE `inscripcion_respuestas`
  ADD PRIMARY KEY (`id_respuesta`),
  ADD UNIQUE KEY `idx_inscripcion_campo` (`id_inscripcion`,`id_campo`),
  ADD KEY `fk_respuesta_inscripcion` (`id_inscripcion`),
  ADD KEY `fk_respuesta_campo` (`id_campo`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD UNIQUE KEY `idx_orden_compra` (`orden_compra`),
  ADD KEY `id_inscripcion` (`id_inscripcion`);

--
-- Indices de la tabla `subeventos`
--
ALTER TABLE `subeventos`
  ADD PRIMARY KEY (`id_subevento`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `tipos_de_entrada`
--
ALTER TABLE `tipos_de_entrada`
  ADD PRIMARY KEY (`id_tipo_entrada`),
  ADD KEY `id_campana` (`id_campana`) USING BTREE;

--
-- Indices de la tabla `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bases_de_datos`
--
ALTER TABLE `bases_de_datos`
  MODIFY `id_base` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `campanas`
--
ALTER TABLE `campanas`
  MODIFY `id_campana` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `campana_formulario_config`
--
ALTER TABLE `campana_formulario_config`
  MODIFY `id_config` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=838;

--
-- AUTO_INCREMENT de la tabla `campo_opciones`
--
ALTER TABLE `campo_opciones`
  MODIFY `id_opcion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT de la tabla `contactos`
--
ALTER TABLE `contactos`
  MODIFY `id_contacto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=210;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `evento_archivos`
--
ALTER TABLE `evento_archivos`
  MODIFY `id_archivo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `formulario_campos`
--
ALTER TABLE `formulario_campos`
  MODIFY `id_campo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  MODIFY `id_inscripcion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=123;

--
-- AUTO_INCREMENT de la tabla `inscripcion_respuestas`
--
ALTER TABLE `inscripcion_respuestas`
  MODIFY `id_respuesta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `subeventos`
--
ALTER TABLE `subeventos`
  MODIFY `id_subevento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `tipos_de_entrada`
--
ALTER TABLE `tipos_de_entrada`
  MODIFY `id_tipo_entrada` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=539;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD CONSTRAINT `campanas_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE,
  ADD CONSTRAINT `campanas_ibfk_2` FOREIGN KEY (`id_subevento`) REFERENCES `subeventos` (`id_subevento`) ON DELETE SET NULL;

--
-- Filtros para la tabla `campana_formulario_config`
--
ALTER TABLE `campana_formulario_config`
  ADD CONSTRAINT `fk_config_campana` FOREIGN KEY (`id_campana`) REFERENCES `campanas` (`id_campana`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_config_campo` FOREIGN KEY (`id_campo`) REFERENCES `formulario_campos` (`id_campo`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `campo_opciones`
--
ALTER TABLE `campo_opciones`
  ADD CONSTRAINT `fk_opcion_campo` FOREIGN KEY (`id_campo`) REFERENCES `formulario_campos` (`id_campo`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `contactos_por_base`
--
ALTER TABLE `contactos_por_base`
  ADD CONSTRAINT `contactos_por_base_ibfk_1` FOREIGN KEY (`id_contacto`) REFERENCES `contactos` (`id_contacto`) ON DELETE CASCADE,
  ADD CONSTRAINT `contactos_por_base_ibfk_2` FOREIGN KEY (`id_base`) REFERENCES `bases_de_datos` (`id_base`) ON DELETE CASCADE;

--
-- Filtros para la tabla `evento_archivos`
--
ALTER TABLE `evento_archivos`
  ADD CONSTRAINT `fk_evento_archivos_evento` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`id_campana`) REFERENCES `campanas` (`id_campana`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`id_contacto`) REFERENCES `contactos` (`id_contacto`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscripciones_ibfk_3` FOREIGN KEY (`id_tipo_entrada`) REFERENCES `tipos_de_entrada` (`id_tipo_entrada`) ON DELETE SET NULL;

--
-- Filtros para la tabla `inscripcion_respuestas`
--
ALTER TABLE `inscripcion_respuestas`
  ADD CONSTRAINT `fk_respuesta_campo` FOREIGN KEY (`id_campo`) REFERENCES `formulario_campos` (`id_campo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_respuesta_inscripcion` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripciones` (`id_inscripcion`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripciones` (`id_inscripcion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `subeventos`
--
ALTER TABLE `subeventos`
  ADD CONSTRAINT `subeventos_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tipos_de_entrada`
--
ALTER TABLE `tipos_de_entrada`
  ADD CONSTRAINT `tipos_de_entrada_ibfk_1` FOREIGN KEY (`id_campana`) REFERENCES `campanas` (`id_campana`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  ADD CONSTRAINT `user_refresh_tokens_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
