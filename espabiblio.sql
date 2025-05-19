-- phpMyAdmin SQL Dump
-- version 4.6.6
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 25-12-2024 a las 23:15:15
-- Versión del servidor: 5.7.17-log
-- Versión de PHP: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `espabiblio`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio`
--

CREATE TABLE `biblio` (
  `bibid` int(11) NOT NULL,
  `create_dt` datetime NOT NULL,
  `last_change_dt` datetime NOT NULL,
  `last_change_userid` int(11) NOT NULL,
  `material_cd` smallint(6) NOT NULL,
  `collection_cd` smallint(6) NOT NULL,
  `call_nmbr1` varchar(20) DEFAULT NULL,
  `call_nmbr2` varchar(20) DEFAULT NULL,
  `call_nmbr3` varchar(20) DEFAULT NULL,
  `title` text,
  `title_remainder` text,
  `responsibility_stmt` text,
  `author` text,
  `topic1` text,
  `topic2` text,
  `topic3` text,
  `topic4` text,
  `topic5` text,
  `opac_flg` char(1) NOT NULL DEFAULT 'Y',
  `has_cover` char(1) DEFAULT 'N'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `biblio`
--





-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio_copy`
--

CREATE TABLE `biblio_copy` (
  `bibid` int(11) NOT NULL,
  `copyid` int(11) NOT NULL,
  `create_dt` datetime NOT NULL,
  `copy_desc` varchar(160) DEFAULT NULL,
  `barcode_nmbr` varchar(20) NOT NULL,
  `status_cd` char(3) NOT NULL,
  `status_begin_dt` datetime NOT NULL,
  `due_back_dt` date DEFAULT NULL,
  `mbrid` int(11) DEFAULT NULL,
  `renewal_count` tinyint(3) UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `biblio_copy`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio_copy_fields`
--

CREATE TABLE `biblio_copy_fields` (
  `bibid` int(11) NOT NULL,
  `copyid` int(11) NOT NULL,
  `code` varchar(16) NOT NULL,
  `data` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio_copy_fields_dm`
--

CREATE TABLE `biblio_copy_fields_dm` (
  `code` varchar(16) NOT NULL,
  `description` char(32) NOT NULL,
  `default_flg` char(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio_field`
--

CREATE TABLE `biblio_field` (
  `bibid` int(11) NOT NULL,
  `fieldid` int(11) NOT NULL,
  `tag` smallint(6) NOT NULL,
  `ind1_cd` char(1) DEFAULT NULL,
  `ind2_cd` char(1) DEFAULT NULL,
  `subfield_cd` char(1) NOT NULL,
  `field_data` text
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `biblio_field`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio_hold`
--

CREATE TABLE `biblio_hold` (
  `bibid` int(11) NOT NULL,
  `copyid` int(11) NOT NULL,
  `holdid` int(11) NOT NULL,
  `hold_begin_dt` datetime NOT NULL,
  `mbrid` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio_status_dm`
--

CREATE TABLE `biblio_status_dm` (
  `code` char(3) NOT NULL,
  `description` varchar(40) NOT NULL,
  `default_flg` char(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `biblio_status_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `biblio_status_hist`
--

CREATE TABLE `biblio_status_hist` (
  `bibid` int(11) NOT NULL,
  `copyid` int(11) NOT NULL,
  `status_cd` char(3) NOT NULL,
  `status_begin_dt` datetime NOT NULL,
  `due_back_dt` date DEFAULT NULL,
  `mbrid` int(11) DEFAULT NULL,
  `renewal_count` tinyint(3) UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `biblio_status_hist`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cdd`
--

CREATE TABLE `cdd` (
  `cdd_Bid` int(11) NOT NULL,
  `cdd_Numero` text,
  `cdd_Descripcion` text,
  `cdd_Clave` text,
  `cdd_Table` text
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `cdd`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cdu`
--

CREATE TABLE `cdu` (
  `cdu_Bid` int(11) NOT NULL,
  `cdu_Numero` text,
  `cdu_Descripcion` text,
  `cdu_Clave` text,
  `cdu_Table` text
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `cdu`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `checkout_privs`
--

CREATE TABLE `checkout_privs` (
  `material_cd` smallint(6) NOT NULL,
  `classification` smallint(6) NOT NULL,
  `checkout_limit` tinyint(3) UNSIGNED NOT NULL,
  `renewal_limit` tinyint(3) UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `checkout_privs`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `collection_dm`
--

CREATE TABLE `collection_dm` (
  `code` smallint(6) NOT NULL,
  `description` varchar(40) NOT NULL,
  `default_flg` char(1) NOT NULL,
  `days_due_back` tinyint(3) UNSIGNED NOT NULL,
  `daily_late_fee` decimal(4,2) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `collection_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cover_options`
--

CREATE TABLE `cover_options` (
  `aws_key` varchar(50) DEFAULT NULL,
  `aws_secret_key` varchar(50) DEFAULT NULL,
  `aws_account_id` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `cover_options`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cutter`
--

CREATE TABLE `cutter` (
  `theName` varchar(32) NOT NULL DEFAULT '',
  `theNmbr` mediumint(9) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `cutter`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ibic`
--

CREATE TABLE `ibic` (
  `ibic_Bid` int(11) NOT NULL,
  `ibic_Numero` text,
  `ibic_Descripcion` text,
  `ibic_Clave` text,
  `ibic_Table` text
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `ibic`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lookup_hosts`
--

CREATE TABLE `lookup_hosts` (
  `id` int(10) UNSIGNED NOT NULL,
  `seq` tinyint(4) NOT NULL,
  `active` enum('y','n') NOT NULL DEFAULT 'n',
  `host` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `db` varchar(20) NOT NULL,
  `user` varchar(20) DEFAULT NULL,
  `pw` varchar(20) DEFAULT NULL,
  `context` varchar(20) DEFAULT 'dc',
  `schema` varchar(20) DEFAULT 'marcxml'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `lookup_hosts`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lookup_manual`
--

CREATE TABLE `lookup_manual` (
  `qmid` int(11) NOT NULL,
  `isbn` varchar(10) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `hits` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lookup_queue`
--

CREATE TABLE `lookup_queue` (
  `qid` int(11) NOT NULL,
  `isbn` varchar(10) NOT NULL,
  `status` enum('queue','manual','publish','copy','cover') NOT NULL DEFAULT 'queue',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tries` tinyint(4) NOT NULL DEFAULT '0',
  `amount` smallint(6) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lookup_settings`
--

CREATE TABLE `lookup_settings` (
  `protocol` enum('YAZ','SRU') NOT NULL DEFAULT 'YAZ',
  `max_hits` tinyint(4) NOT NULL DEFAULT '25',
  `keep_dashes` enum('y','n') NOT NULL DEFAULT 'n',
  `callNmbr_type` enum('LoC','Dew','UDC','local') NOT NULL DEFAULT 'Dew',
  `auto_dewey` enum('y','n') NOT NULL DEFAULT 'y',
  `default_dewey` varchar(10) NOT NULL DEFAULT '813.52',
  `auto_cutter` enum('y','n') NOT NULL DEFAULT 'y',
  `cutter_type` enum('LoC','CS3') NOT NULL DEFAULT 'CS3',
  `cutter_word` tinyint(4) NOT NULL DEFAULT '1',
  `auto_collect` enum('y','n') NOT NULL DEFAULT 'y',
  `fiction_name` varchar(10) NOT NULL DEFAULT 'Fiction',
  `fiction_code` tinyint(4) NOT NULL DEFAULT '1',
  `fiction_loc` varchar(255) NOT NULL DEFAULT 'PQ PR PS PT PU PV PW PX PY PZ',
  `fiction_dewey` varchar(255) NOT NULL DEFAULT '813 823'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `lookup_settings`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `material_type_dm`
--

CREATE TABLE `material_type_dm` (
  `code` smallint(6) NOT NULL,
  `description` varchar(40) NOT NULL,
  `default_flg` char(1) NOT NULL,
  `image_file` varchar(128) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `material_type_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `material_usmarc_xref`
--

CREATE TABLE `material_usmarc_xref` (
  `xref_id` int(11) NOT NULL,
  `materialCd` int(11) NOT NULL DEFAULT '0',
  `tag` char(3) NOT NULL DEFAULT '',
  `subfieldCd` char(1) NOT NULL DEFAULT '',
  `descr` varchar(64) NOT NULL DEFAULT '',
  `required` char(1) NOT NULL DEFAULT '',
  `cntrltype` char(1) NOT NULL DEFAULT ''
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mbr_classify_dm`
--

CREATE TABLE `mbr_classify_dm` (
  `code` smallint(6) NOT NULL,
  `description` varchar(40) NOT NULL,
  `default_flg` char(1) NOT NULL,
  `max_fines` decimal(4,2) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `mbr_classify_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `member`
--

CREATE TABLE `member` (
  `mbrid` int(11) NOT NULL,
  `barcode_nmbr` varchar(20) NOT NULL,
  `create_dt` datetime NOT NULL,
  `last_change_dt` datetime NOT NULL,
  `last_change_userid` int(11) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `address` text,
  `home_phone` varchar(15) DEFAULT NULL,
  `work_phone` varchar(15) DEFAULT NULL,
  `cel` varchar(15) DEFAULT NULL,
  `email` varchar(128) DEFAULT NULL,
  `foto` varchar(128) DEFAULT NULL,
  `pass_user` char(32) DEFAULT NULL,
  `born_dt` date NOT NULL,
  `other` text,
  `classification` smallint(6) NOT NULL,
  `is_active` char(1) DEFAULT 'Y',
  `last_activity_dt` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `member`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `member_account`
--

CREATE TABLE `member_account` (
  `mbrid` int(11) NOT NULL,
  `transid` int(11) NOT NULL,
  `create_dt` datetime NOT NULL,
  `create_userid` int(11) NOT NULL,
  `transaction_type_cd` char(2) NOT NULL,
  `amount` decimal(8,2) NOT NULL,
  `description` varchar(128) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `member_account`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `member_fields`
--

CREATE TABLE `member_fields` (
  `mbrid` int(11) NOT NULL,
  `code` varchar(16) NOT NULL,
  `data` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `member_fields`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `member_fields_dm`
--

CREATE TABLE `member_fields_dm` (
  `code` varchar(16) NOT NULL,
  `description` char(32) NOT NULL,
  `default_flg` char(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `member_fields_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `session`
--

CREATE TABLE `session` (
  `userid` int(5) NOT NULL,
  `last_updated_dt` datetime NOT NULL,
  `token` int(5) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `session`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `settings`
--

CREATE TABLE `settings` (
  `library_name` varchar(128) DEFAULT NULL,
  `library_image_url` text,
  `use_image_flg` char(1) NOT NULL,
  `library_hours` varchar(128) DEFAULT NULL,
  `library_aders` varchar(70) DEFAULT NULL,
  `library_phone` varchar(40) DEFAULT NULL,
  `library_url` text,
  `opac_url` text,
  `session_timeout` smallint(6) NOT NULL,
  `items_per_page` tinyint(4) NOT NULL,
  `version` varchar(10) NOT NULL,
  `themeid` smallint(6) NOT NULL,
  `purge_history_after_months` smallint(6) NOT NULL,
  `block_checkouts_when_fines_due` char(1) NOT NULL,
  `hold_max_days` smallint(6) NOT NULL,
  `locale` varchar(8) NOT NULL,
  `charset` varchar(20) DEFAULT NULL,
  `html_lang_attr` varchar(8) DEFAULT NULL,
  `font_normal` varchar(20) DEFAULT NULL,
  `font_size` tinyint(3) DEFAULT NULL,
  `inactive_member_after_days` smallint(6) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `settings`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `staff`
--

CREATE TABLE `staff` (
  `userid` int(11) NOT NULL,
  `create_dt` datetime NOT NULL,
  `last_change_dt` datetime NOT NULL,
  `last_change_userid` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  `pwd` char(32) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `first_name` varchar(30) DEFAULT NULL,
  `suspended_flg` char(1) NOT NULL,
  `admin_flg` char(1) NOT NULL,
  `circ_flg` char(1) NOT NULL,
  `circ_mbr_flg` char(1) NOT NULL,
  `catalog_flg` char(1) NOT NULL,
  `reports_flg` char(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `staff`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `theme`
--

CREATE TABLE `theme` (
  `themeid` smallint(6) NOT NULL,
  `theme_name` varchar(40) NOT NULL,
  `title_bg` varchar(20) NOT NULL,
  `title_font_face` varchar(128) NOT NULL,
  `title_font_size` tinyint(4) NOT NULL,
  `title_font_bold` char(1) NOT NULL,
  `title_font_color` varchar(20) NOT NULL,
  `title_align` varchar(30) NOT NULL,
  `primary_bg` varchar(20) NOT NULL,
  `primary_font_face` varchar(128) NOT NULL,
  `primary_font_size` tinyint(4) NOT NULL,
  `primary_font_color` varchar(20) NOT NULL,
  `primary_link_color` varchar(20) NOT NULL,
  `primary_error_color` varchar(20) NOT NULL,
  `alt1_bg` varchar(20) NOT NULL,
  `alt1_font_face` varchar(128) NOT NULL,
  `alt1_font_size` tinyint(4) NOT NULL,
  `alt1_font_color` varchar(20) NOT NULL,
  `alt1_link_color` varchar(20) NOT NULL,
  `alt2_bg` varchar(20) NOT NULL,
  `alt2_font_face` varchar(128) NOT NULL,
  `alt2_font_size` tinyint(4) NOT NULL,
  `alt2_font_color` varchar(20) NOT NULL,
  `alt2_link_color` varchar(20) NOT NULL,
  `alt2_font_bold` char(1) NOT NULL,
  `border_color` varchar(20) NOT NULL,
  `border_width` tinyint(4) NOT NULL,
  `table_padding` tinyint(4) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `theme`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transaction_type_dm`
--

CREATE TABLE `transaction_type_dm` (
  `code` char(2) NOT NULL,
  `description` varchar(40) NOT NULL,
  `default_flg` char(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `transaction_type_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usmarc_block_dm`
--

CREATE TABLE `usmarc_block_dm` (
  `block_nmbr` tinyint(4) NOT NULL,
  `description` varchar(80) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `usmarc_block_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usmarc_indicator_dm`
--

CREATE TABLE `usmarc_indicator_dm` (
  `tag` smallint(6) NOT NULL,
  `indicator_nmbr` tinyint(4) NOT NULL,
  `indicator_cd` char(1) NOT NULL,
  `description` varchar(80) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `usmarc_indicator_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usmarc_subfield_dm`
--

CREATE TABLE `usmarc_subfield_dm` (
  `tag` smallint(6) NOT NULL,
  `subfield_cd` char(1) NOT NULL,
  `description` varchar(80) NOT NULL,
  `repeatable_flg` char(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `usmarc_subfield_dm`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usmarc_tag_dm`
--

CREATE TABLE `usmarc_tag_dm` (
  `block_nmbr` tinyint(4) NOT NULL,
  `tag` smallint(6) NOT NULL,
  `description` varchar(80) NOT NULL,
  `ind1_description` varchar(80) NOT NULL,
  `ind2_description` varchar(80) NOT NULL,
  `repeatable_flg` char(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `usmarc_tag_dm`
--


--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `biblio`
--
ALTER TABLE `biblio`
  ADD PRIMARY KEY (`bibid`);

--
-- Indices de la tabla `biblio_copy`
--
ALTER TABLE `biblio_copy`
  ADD PRIMARY KEY (`bibid`,`copyid`),
  ADD KEY `barcode_index` (`barcode_nmbr`),
  ADD KEY `mbr_index` (`mbrid`);

--
-- Indices de la tabla `biblio_copy_fields`
--
ALTER TABLE `biblio_copy_fields`
  ADD PRIMARY KEY (`bibid`,`copyid`,`code`),
  ADD KEY `code_index` (`code`);

--
-- Indices de la tabla `biblio_copy_fields_dm`
--
ALTER TABLE `biblio_copy_fields_dm`
  ADD PRIMARY KEY (`code`);

--
-- Indices de la tabla `biblio_field`
--
ALTER TABLE `biblio_field`
  ADD PRIMARY KEY (`bibid`,`fieldid`);

--
-- Indices de la tabla `biblio_hold`
--
ALTER TABLE `biblio_hold`
  ADD PRIMARY KEY (`bibid`,`copyid`,`holdid`),
  ADD KEY `mbr_index` (`mbrid`);

--
-- Indices de la tabla `biblio_status_dm`
--
ALTER TABLE `biblio_status_dm`
  ADD PRIMARY KEY (`code`);

--
-- Indices de la tabla `biblio_status_hist`
--
ALTER TABLE `biblio_status_hist`
  ADD KEY `mbr_index` (`mbrid`),
  ADD KEY `copy_index` (`bibid`,`copyid`);

--
-- Indices de la tabla `cdd`
--
ALTER TABLE `cdd`
  ADD PRIMARY KEY (`cdd_Bid`);

--
-- Indices de la tabla `cdu`
--
ALTER TABLE `cdu`
  ADD PRIMARY KEY (`cdu_Bid`);

--
-- Indices de la tabla `checkout_privs`
--
ALTER TABLE `checkout_privs`
  ADD PRIMARY KEY (`material_cd`,`classification`);

--
-- Indices de la tabla `collection_dm`
--
ALTER TABLE `collection_dm`
  ADD PRIMARY KEY (`code`);

--
-- Indices de la tabla `cutter`
--
ALTER TABLE `cutter`
  ADD PRIMARY KEY (`theName`);

--
-- Indices de la tabla `ibic`
--
ALTER TABLE `ibic`
  ADD PRIMARY KEY (`ibic_Bid`);

--
-- Indices de la tabla `lookup_hosts`
--
ALTER TABLE `lookup_hosts`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `lookup_manual`
--
ALTER TABLE `lookup_manual`
  ADD PRIMARY KEY (`qmid`);

--
-- Indices de la tabla `lookup_queue`
--
ALTER TABLE `lookup_queue`
  ADD PRIMARY KEY (`qid`);

--
-- Indices de la tabla `material_type_dm`
--
ALTER TABLE `material_type_dm`
  ADD PRIMARY KEY (`code`);

--
-- Indices de la tabla `material_usmarc_xref`
--
ALTER TABLE `material_usmarc_xref`
  ADD PRIMARY KEY (`xref_id`);

--
-- Indices de la tabla `mbr_classify_dm`
--
ALTER TABLE `mbr_classify_dm`
  ADD PRIMARY KEY (`code`);

--
-- Indices de la tabla `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`mbrid`);

--
-- Indices de la tabla `member_account`
--
ALTER TABLE `member_account`
  ADD PRIMARY KEY (`mbrid`,`transid`);

--
-- Indices de la tabla `member_fields`
--
ALTER TABLE `member_fields`
  ADD PRIMARY KEY (`mbrid`,`code`),
  ADD KEY `code_index` (`code`);

--
-- Indices de la tabla `member_fields_dm`
--
ALTER TABLE `member_fields_dm`
  ADD PRIMARY KEY (`code`);

--
-- Indices de la tabla `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`userid`);

--
-- Indices de la tabla `theme`
--
ALTER TABLE `theme`
  ADD PRIMARY KEY (`themeid`);

--
-- Indices de la tabla `transaction_type_dm`
--
ALTER TABLE `transaction_type_dm`
  ADD PRIMARY KEY (`code`);

--
-- Indices de la tabla `usmarc_block_dm`
--
ALTER TABLE `usmarc_block_dm`
  ADD PRIMARY KEY (`block_nmbr`);

--
-- Indices de la tabla `usmarc_indicator_dm`
--
ALTER TABLE `usmarc_indicator_dm`
  ADD PRIMARY KEY (`tag`,`indicator_nmbr`,`indicator_cd`);

--
-- Indices de la tabla `usmarc_subfield_dm`
--
ALTER TABLE `usmarc_subfield_dm`
  ADD PRIMARY KEY (`tag`,`subfield_cd`);

--
-- Indices de la tabla `usmarc_tag_dm`
--
ALTER TABLE `usmarc_tag_dm`
  ADD PRIMARY KEY (`block_nmbr`,`tag`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `biblio`
--
ALTER TABLE `biblio`
  MODIFY `bibid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14236;
--
-- AUTO_INCREMENT de la tabla `biblio_copy`
--
ALTER TABLE `biblio_copy`
  MODIFY `copyid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `biblio_field`
--
ALTER TABLE `biblio_field`
  MODIFY `fieldid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `biblio_hold`
--
ALTER TABLE `biblio_hold`
  MODIFY `holdid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cdd`
--
ALTER TABLE `cdd`
  MODIFY `cdd_Bid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9455;
--
-- AUTO_INCREMENT de la tabla `cdu`
--
ALTER TABLE `cdu`
  MODIFY `cdu_Bid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58749;
--
-- AUTO_INCREMENT de la tabla `collection_dm`
--
ALTER TABLE `collection_dm`
  MODIFY `code` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
--
-- AUTO_INCREMENT de la tabla `ibic`
--
ALTER TABLE `ibic`
  MODIFY `ibic_Bid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3670;
--
-- AUTO_INCREMENT de la tabla `lookup_hosts`
--
ALTER TABLE `lookup_hosts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=123;
--
-- AUTO_INCREMENT de la tabla `lookup_manual`
--
ALTER TABLE `lookup_manual`
  MODIFY `qmid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `lookup_queue`
--
ALTER TABLE `lookup_queue`
  MODIFY `qid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `material_type_dm`
--
ALTER TABLE `material_type_dm`
  MODIFY `code` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
--
-- AUTO_INCREMENT de la tabla `material_usmarc_xref`
--
ALTER TABLE `material_usmarc_xref`
  MODIFY `xref_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT de la tabla `mbr_classify_dm`
--
ALTER TABLE `mbr_classify_dm`
  MODIFY `code` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT de la tabla `member`
--
ALTER TABLE `member`
  MODIFY `mbrid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=148;
--
-- AUTO_INCREMENT de la tabla `member_account`
--
ALTER TABLE `member_account`
  MODIFY `transid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `staff`
--
ALTER TABLE `staff`
  MODIFY `userid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT de la tabla `theme`
--
ALTER TABLE `theme`
  MODIFY `themeid` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
