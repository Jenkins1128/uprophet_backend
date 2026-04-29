-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `comments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`quotes_id` bigint NOT NULL,
	`comment` varchar(255) NOT NULL,
	`commenter` varchar(20) NOT NULL,
	`date_posted` datetime,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorite_notifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`notice` tinytext NOT NULL,
	`to_user` varchar(20) NOT NULL,
	`read` int NOT NULL DEFAULT 0,
	`date` datetime,
	CONSTRAINT `favorite_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favoriting` (
	`from_user` varchar(20) NOT NULL,
	`to_user` varchar(20) NOT NULL,
	CONSTRAINT `favoriting_from_user_to_user` PRIMARY KEY(`from_user`,`to_user`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`users_id` bigint NOT NULL,
	`quotes_id` bigint NOT NULL,
	CONSTRAINT `likes_users_id_quotes_id` PRIMARY KEY(`users_id`,`quotes_id`)
);
--> statement-breakpoint
CREATE TABLE `login` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`password` varchar(128) NOT NULL,
	`user_name` varchar(20) NOT NULL,
	`users_id` bigint NOT NULL,
	`user_registered` bigint NOT NULL,
	CONSTRAINT `login_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_name_UNIQUE` UNIQUE(`user_name`)
);
--> statement-breakpoint
CREATE TABLE `quote_notifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`notice` tinytext NOT NULL,
	`quotes_id` bigint NOT NULL,
	`read` int NOT NULL DEFAULT 0,
	`date` datetime,
	CONSTRAINT `quote_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_name` varchar(20),
	`title` varchar(255),
	`quote` text,
	`date_posted` datetime,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(20),
	`user_name` varchar(20),
	`email` varchar(100),
	`photo` longblob,
	`bio` text,
	`photo_name` varchar(100),
	`refresh_token` varchar(1000),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_name_UNIQUE` UNIQUE(`user_name`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `quotes_id` FOREIGN KEY (`quotes_id`) REFERENCES `quotes`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `likes` ADD CONSTRAINT `like_quotes_id` FOREIGN KEY (`quotes_id`) REFERENCES `quotes`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `likes` ADD CONSTRAINT `like_users_id` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `login` ADD CONSTRAINT `users_id` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `quotes_id_idx` ON `comments` (`quotes_id`);--> statement-breakpoint
CREATE INDEX `quotes_id_idx` ON `likes` (`quotes_id`);--> statement-breakpoint
CREATE INDEX `_idx` ON `login` (`users_id`);--> statement-breakpoint
CREATE INDEX `quotes_id_idx` ON `quote_notifications` (`quotes_id`);
*/