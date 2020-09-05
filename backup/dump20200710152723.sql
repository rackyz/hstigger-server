/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: task
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `task` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `root_id` int(11) DEFAULT NULL,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `state` int(11) NOT NULL,
  `task_type` int(11) NOT NULL,
  `duration` int(11) DEFAULT NULL,
  `charger` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `start_at` datetime DEFAULT NULL,
  `finish_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: archive
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `archive` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `root_id` int(11) DEFAULT NULL,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `desc` varchar(512) COLLATE utf8_unicode_ci DEFAULT NULL,
  `data` text COLLATE utf8_unicode_ci,
  `files` text COLLATE utf8_unicode_ci NOT NULL,
  `dlcount` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: dep_user
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `dep_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dep_id` int(11) DEFAULT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `role_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 19 DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: file
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `file` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `url` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `dlcount` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: knex_migrations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `knex_migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: knex_migrations_lock
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `knex_migrations_lock` (
  `index` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int(11) DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: project
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `project` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `state` int(11) NOT NULL,
  `contract_type` int(11) NOT NULL,
  `building_type` int(11) NOT NULL,
  `area` float(8, 2) DEFAULT NULL,
  `building_area` float(8, 2) DEFAULT NULL,
  `building_height` float(8, 2) DEFAULT NULL,
  `levels` int(11) DEFAULT NULL,
  `amount` float(8, 2) DEFAULT NULL,
  `data` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: role
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `role` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `color` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  `data` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: role_user
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `role_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` int(11) DEFAULT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: session
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `session` (
  `id` varchar(256) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `login_at` datetime NOT NULL,
  `expire_time` int(11) NOT NULL,
  `client_device` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `ip` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  KEY `session_id_index` (`id`(255))
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: dep
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `dep` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `color` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  `data` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 41 DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: type
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `type` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `color` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  `data` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: user
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user` varchar(16) COLLATE utf8_unicode_ci DEFAULT NULL,
  `phone` varchar(16) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `avatar` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `state` int(11) DEFAULT '0',
  UNIQUE KEY `user_user_unique` (`user`),
  UNIQUE KEY `user_phone_unique` (`phone`),
  UNIQUE KEY `user_name_unique` (`name`),
  KEY `user_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: user_workflow
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user_workflow` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `workflow_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workflow
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workflow` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `desc` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  `flow_type` int(11) DEFAULT NULL,
  `create_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  KEY `workflow_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workflow_action
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workflow_action` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `workflow_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `from` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `to` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  KEY `workflow_action_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workflow_data
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workflow_data` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `field_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `workflow_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `node_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `record_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `version` int(11) DEFAULT '0',
  `value` text COLLATE utf8_unicode_ci,
  `stage` int(11) DEFAULT NULL,
  KEY `workflow_data_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workflow_field
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workflow_field` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `workflow_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  `option` text COLLATE utf8_unicode_ci,
  KEY `workflow_field_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workflow_instance
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workflow_instance` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `workflow_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `states` text COLLATE utf8_unicode_ci,
  `executors` text COLLATE utf8_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  KEY `workflow_instance_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workflow_node
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workflow_node` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `flow_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  `name` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `view` text COLLATE utf8_unicode_ci,
  KEY `workflow_node_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: workflow_record
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workflow_record` (
  `id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `workflow_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  KEY `workflow_record_id_index` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: task
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: archive
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: dep_user
# ------------------------------------------------------------

INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (1, 1, 'd12664ad-9662-4224-9678-7c4d655f53f2', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (2, 3, 'd12664ad-9662-4224-9678-7c4d655f53f2', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (3, 10, 'd12664ad-9662-4224-9678-7c4d655f53f2', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (4, 18, 'b9fdf31c-883b-4673-b73a-42f9e5b284e8', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (5, 10, 'b9fdf31c-883b-4673-b73a-42f9e5b284e8', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (15, 1, 'ADMIN', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (16, 3, 'ADMIN', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (17, 9, 'ADMIN', NULL);
INSERT INTO
  `dep_user` (`id`, `dep_id`, `user_id`, `role_id`)
VALUES
  (
    18,
    NULL,
    'ad82eacd-04fd-4adb-b885-cbb13c14e49c',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: file
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: knex_migrations
# ------------------------------------------------------------

INSERT INTO
  `knex_migrations` (`id`, `name`, `batch`, `migration_time`)
VALUES
  (
    1,
    '20200624061929_initdb.js',
    1,
    '2020-06-28 08:40:36'
  );
INSERT INTO
  `knex_migrations` (`id`, `name`, `batch`, `migration_time`)
VALUES
  (
    2,
    '20200627103751_workflow.js',
    1,
    '2020-06-28 08:40:36'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: knex_migrations_lock
# ------------------------------------------------------------

INSERT INTO
  `knex_migrations_lock` (`index`, `is_locked`)
VALUES
  (1, 0);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: project
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: role
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: role_user
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: session
# ------------------------------------------------------------

INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAiLCJpYXQiOjE1OTMzMDkzOTIsImV4cCI6MTU5MzM5NTc5Mn0.mHnU4JAt_g0rnjT6kICSEMvR7ShkR8b3JwTjXSpktCk',
    'ADMIN',
    '2020-06-28 09:56:32',
    86400,
    'PostmanRuntime/7',
    '::ffff:127.0.0.1'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAiLCJpYXQiOjE1OTQwODk5MjQsImV4cCI6MTU5NDE3NjMyNH0.lNTWkA7mOB1vCMynLe86Z4_pL8pn4qEc-7XIJEJllho',
    'ADMIN',
    '2020-07-07 10:45:24',
    86400,
    'Mozilla/5.0 (Win',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MTEyMTA0LCJleHAiOjE1OTQxOTg1MDR9.jjaDsARsjmWRYEfUFCPRDK1_k8v_bmlljq_mX3fuLXo',
    'ADMIN',
    '2020-07-07 16:55:04',
    86400,
    'Mozilla/5.0 (Linux; Android 6.0;',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MTEyMjM0LCJleHAiOjE1OTQxOTg2MzR9.9vk1JoE7T3bvEtxoPUNujf3ZkPJ-9y-6uhLv8oE15Xo',
    'ADMIN',
    '2020-07-07 16:57:14',
    86400,
    'Mozilla/5.0 (Linux; Android 6.0;',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MTEyMzQyLCJleHAiOjE1OTQxOTg3NDJ9.qTh4sy1PiROQo3B2QyTjt5p7WCf3mrgdPZ2YsOV4rQc',
    'ADMIN',
    '2020-07-07 16:59:02',
    86400,
    'Mozilla/5.0 (Windows NT 10.0; Wi',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MTEyNDUxLCJleHAiOjE1OTQxOTg4NTF9.FoQFAmDJ_gPrAqYyx-wNpful7_OEDgGcCUqwFFYcSmU',
    'ADMIN',
    '2020-07-07 17:00:51',
    86400,
    'Mozilla/5.0 (Windows NT 10.0; Wi',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MTY4ODc2LCJleHAiOjE1OTQyNTUyNzZ9.uT7Q7YAY8n00wtAW_CpFHxmid1sYXiwjmAHoO9u8r5g',
    'ADMIN',
    '2020-07-08 08:41:16',
    86400,
    'Mozilla/5.0 (Windows NT 10.0; Wi',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MjU0MTI1LCJleHAiOjE1OTQzNDA1MjV9.oiqVE_VZzeUGNdNjI6BR7g0Vlk6LL5rp3-sTCo0j8JQ',
    'ADMIN',
    '2020-07-09 08:22:05',
    86400,
    'Mozilla/5.0 (Windows NT 10.0; Wi',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MjU1ODkxLCJleHAiOjE1OTQzNDIyOTF9.dMYWO5V1P7qstTJp1SVYlyESvcPatC1W-F9hXhHhkz4',
    'ADMIN',
    '2020-07-09 08:51:31',
    86400,
    'Mozilla/5.0 (Linux; Android 6.0;',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MjYwNjk1LCJleHAiOjE1OTQzNDcwOTV9.5fsUTRvdaNkugqUcM0GmSNEEZy6x4WsexH7TLDMl0rU',
    'ADMIN',
    '2020-07-09 10:11:35',
    86400,
    'Mozilla/5.0 (Windows NT 10.0; Wi',
    '192.168.14.40'
  );
INSERT INTO
  `session` (
    `id`,
    `user_id`,
    `login_at`,
    `expire_time`,
    `client_device`,
    `ip`
  )
VALUES
  (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOIiwiaWF0IjoxNTk0MzM1NTg5LCJleHAiOjE1OTQ0MjE5ODl9.nPc-RDrFwl8HBpJdS_c1kO2P240vSJkAz75EufF2no8',
    'ADMIN',
    '2020-07-10 06:59:49',
    86400,
    'Mozilla/5.0 (Windows NT 10.0; Wi',
    '192.168.14.40'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: dep
# ------------------------------------------------------------

INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (0, NULL, '公司', '', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (1, NULL, '外部合作', '', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (3, 0, '财务室', '#EABB1E', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (9, 5, '4144', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (10, 5, '41445', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (18, 1, '5234', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (19, 1, '4153', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (20, 9, '456', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (22, 6, '4123', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (23, 5, '314', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (25, 0, '总师室', '#18C1FF', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (26, 0, '领导层', '#F41111', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (27, 0, '经营部', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (28, 21, '55', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (33, 1, '666', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (36, 34, 'xxx', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (37, NULL, '技术部', '#333333', '');
INSERT INTO
  `dep` (`id`, `parent_id`, `name`, `color`, `data`)
VALUES
  (38, NULL, '123', '#333333', '');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: type
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: user
# ------------------------------------------------------------

INSERT INTO
  `user` (
    `id`,
    `user`,
    `phone`,
    `password`,
    `name`,
    `avatar`,
    `created_at`,
    `created_by`,
    `state`
  )
VALUES
  (
    'ADMIN',
    'root',
    '15991913205',
    'root',
    '超级管理员',
    'https://nbgz-pmis-1257839135.cos.ap-shanghai.myqcloud.com/icon/guest.png',
    NULL,
    NULL,
    0
  );
INSERT INTO
  `user` (
    `id`,
    `user`,
    `phone`,
    `password`,
    `name`,
    `avatar`,
    `created_at`,
    `created_by`,
    `state`
  )
VALUES
  (
    'ad82eacd-04fd-4adb-b885-cbb13c14e49c',
    'hujiahan3',
    '198888211126',
    '881234',
    '胡佳翰2',
    'https://nbgz-pmis-1257839135.cos.ap-shanghai.myqcloud.com/admin.png',
    NULL,
    'ADMIN',
    0
  );
INSERT INTO
  `user` (
    `id`,
    `user`,
    `phone`,
    `password`,
    `name`,
    `avatar`,
    `created_at`,
    `created_by`,
    `state`
  )
VALUES
  (
    'b9fdf31c-883b-4673-b73a-42f9e5b284e8',
    '4124123',
    '1234564',
    '',
    '1231',
    NULL,
    NULL,
    NULL,
    0
  );
INSERT INTO
  `user` (
    `id`,
    `user`,
    `phone`,
    `password`,
    `name`,
    `avatar`,
    `created_at`,
    `created_by`,
    `state`
  )
VALUES
  (
    'ccfe6763-9ae7-4cea-9ff0-a88d346b7e45',
    '436a',
    NULL,
    '123456',
    '4',
    NULL,
    NULL,
    NULL,
    0
  );
INSERT INTO
  `user` (
    `id`,
    `user`,
    `phone`,
    `password`,
    `name`,
    `avatar`,
    `created_at`,
    `created_by`,
    `state`
  )
VALUES
  (
    'd12664ad-9662-4224-9678-7c4d655f53f2',
    'hujiahan',
    '19888821112712',
    '',
    '胡佳翰',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkIAAAJcCAYAAAFifPt9AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFxEAABcRAc',
    NULL,
    NULL,
    0
  );
INSERT INTO
  `user` (
    `id`,
    `user`,
    `phone`,
    `password`,
    `name`,
    `avatar`,
    `created_at`,
    `created_by`,
    `state`
  )
VALUES
  (
    '2c28e909-a63a-4831-831a-5aa04c265eeb',
    '4446',
    '123',
    '',
    '51231',
    NULL,
    NULL,
    NULL,
    0
  );
INSERT INTO
  `user` (
    `id`,
    `user`,
    `phone`,
    `password`,
    `name`,
    `avatar`,
    `created_at`,
    `created_by`,
    `state`
  )
VALUES
  (
    'eb4bbf58-3737-4d09-b06b-54b16d1b0961',
    '4444',
    '44',
    '',
    '4444',
    NULL,
    NULL,
    'ADMIN',
    0
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: user_workflow
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workflow
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workflow_action
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workflow_data
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workflow_field
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workflow_instance
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workflow_node
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: workflow_record
# ------------------------------------------------------------


/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
