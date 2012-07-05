#!/usr/bin/perl

package Database;

use strict;
use warnings;

use DBI;
use Carp qw( croak );

sub new {
    my $type = shift;
    my $db_file = shift;
    my $class = ref $type || $type;

    my $dbh = DBI->connect("dbi:SQLite:dbname=$db_file", "", "",{PrintError => 1,AutoCommit => 0});

    my $self = {
        dbh => $dbh
    };

    bless $self, $class;

    return $self;
}

sub add_board {
    my $self = shift;
    my $board = shift || croak("need board");

    my $sth_1 = $self->{dbh}->prepare("INSERT OR IGNORE INTO `boards`(`board`) VALUES(?)");
    my $sth_2 = $self->{dbh}->prepare("SELECT `board_id` FROM `boards` WHERE `board` = ?");

    $sth_1->execute($board);
    $sth_2->execute($board);

    my ($board_id) = $sth_2->fetchrow;
    $self->{dbh}->commit;
    
    return $board_id;
}

sub add_thread {
    my $self = shift;
    my $board_id = shift || croak("need board_id");
    my $thread_id = shift || croak("need thread_id");

    my $sth_1 = $self->{dbh}->prepare("INSERT OR IGNORE INTO `threads`(`board_id`,`thread_id`) VALUES(?,?)");
    my $sth_2 = $self->{dbh}->prepare("SELECT `threads_rowid` FROM `threads` WHERE `board_id` = ? AND `thread_id` = ?");

    $sth_1->execute($board_id,$thread_id);
    $sth_2->execute($board_id,$thread_id);

    my ($threads_rowid) = $sth_2->fetchrow;
    $self->{dbh}->commit;

    return $threads_rowid;
}

sub add_post {
    my $self = shift;
    my $threads_rowid = shift || croak("need threads_rowid");
    my $post_id = shift || croak("need post_id");
    my $subject = shift;
    my $user = shift;
    my $date = shift;
    my $text = shift;

    my $sth_1 = $self->{dbh}->prepare("INSERT OR IGNORE INTO `posts`(`threads_rowid`,`post_id`,`subject`,`user`,`date`,`text`)
                                       VALUES(?,?,?,?,?,?)");

    my $sth_2 = $self->{dbh}->prepare("SELECT `posts_rowid` FROM `posts`
                                       WHERE `threads_rowid` = ? AND `post_id` = ?");

    $sth_1->execute($threads_rowid, $post_id, $subject, $user, $date, $text);
    $sth_2->execute($threads_rowid,$post_id);

    my ($posts_rowid) = $sth_2->fetchrow;
    $self->{dbh}->commit;

    return $posts_rowid
}

sub add_file {
    my $self = shift;
    my $path = shift || croak("need path");
    my $md5 = shift || croak("need md5");

    my $sth_1 = $self->{dbh}->prepare("INSERT OR IGNORE INTO `files`(`path`,`md5`) VALUES(?,?)");
    my $sth_2 = $self->{dbh}->prepare("SELECT `file_id` FROM `files` WHERE `md5` = ?");

    $sth_1->execute($path,$md5);
    $sth_2->execute($md5);

    my ($file_id) = $sth_2->fetchrow;
    $self->{dbh}->commit;

    return $file_id;
}

sub add_file_to_post {
    my $self = shift;
    my $file_id = shift || croak("need file_id");
    my $posts_rowid = shift || croak("need posts_rowid");

    my $sth = $self->{dbh}->prepare("INSERT OR IGNORE INTO `post_files`(`file_id`,`posts_rowid`) VALUES(?,?)");

    $sth->execute($file_id,$posts_rowid);

    $self->{dbh}->commit;
}


sub add_tag {
    my $self = shift;
    my $tag = shift || croak("need tag");

    my $sth_1 = $self->{dbh}->prepare("INSERT OR IGNORE INTO `tags`(`tag`) VALUES(?)");
    my $sth_2 = $self->{dbh}->prepare("SELECT `tags_rowid` FROM `tags` WHERE `tag` = ?");

    $sth_1->execute($tag);
    $sth_2->execute($tag);

    my ($tags_rowid) = $sth_2->fetchrow;
    $self->{dbh}->commit;

    return $tags_rowid;
}

sub add_tag_to_file {
    my $self = shift;
    my $tags_rowid = shift || croak("need tags_rowid");
    my $file_id = shift || croak("need file_id");

    my $sth = $self->{dbh}->prepare("INSERT OR IGNORE INTO `file_tags`(`tags_rowid`,`file_id`) VALUES(?,?)");

    $sth->execute($tags_rowid,$file_id);

    $self->{dbh}->commit;
}

sub get_thread {
    my $self = shift;
    my $board_id = shift || croak("need board_id");
    my $thread_id = shift || croak("need thread_id");

    my $sth = $self->{dbh}->prepare("SELECT `posts_rowid`,`post_id`,`subject`,`user`,`date`,`text`
                                           FROM `posts`
                                           JOIN `threads` USING(`threads_rowid`)
                                           WHERE `board_id` = ? AND `thread_id` = ?
                                           ORDER BY `post_id` ASC");

    $sth->execute($board_id, $thread_id);

    my @post_list = ();
    while(my ($posts_rowid,$post_id,$subject,$user,$date,$text) = $sth->fetchrow) {
        push(@post_list, { posts_rowid => $posts_rowid,
                           post_id => $post_id,
                           subject => $subject,
                           user => $user,
                           date => $date,
                           text => $text });
    }

    return \@post_list;
}

sub get_post {
    my $self = shift;
    my $board_id = shift || croak("need board_id");
    my $post_id = shift || croak("need post_id");

    my $sth = $self->{dbh}->prepare("SELECT `posts_rowid`,`thread_id`,`subject`,`user`,`date`,`text` FROM `posts`
                                     JOIN `threads` USING(`threads_rowid`)
                                     WHERE `board_id` = ? AND `post_id` = ?");

    $sth->execute($board_id, $post_id);

    if(my ($posts_rowid,$thread_id,$subject,$user,$date,$text) = $sth->fetchrow) {
        return {
            posts_rowid => $posts_rowid,
            thread_id => $thread_id,
            subject => $subject,
            user => $user,
            date => $date,
            text => $text
        }
    } else {
        return undef;
    }
}

sub get_file {
    my $self = shift;
    my $file_id = shift || croak("need file_id");

    my $sth = $self->{dbh}->prepare("SELECT `file_id`, `path`, `md5`
                                     FROM `files` WHERE `file_id` = ?");
    $sth->execute($file_id);

    if(my ($id,$path,$md5) = $sth->fetchrow) {
        return { 
            file_id => $id,
            path => $path,
            md5 => $md5
        };
    } else {
        return undef;
    }
}

sub get_file_by_md5 {
    my $self = shift;
    my $md5 = shift || croak("need md5");

    my $sth = $self->{dbh}->prepare("SELECT `file_id`, `path`, `md5` FROM `files` WHERE `md5` = ?");
    $sth->execute($md5);

    if(my ($file_id,$path,$md5) = $sth->fetchrow) {
        return { 
            file_id => $file_id,
            path => $path,
            md5 => $md5
        };
    } else {
        return undef;
    }
}


sub get_board_list {
    my $self = shift;

    my $sth = $self->{dbh}->prepare("SELECT `board_id`,`board` FROM boards ORDER BY `board`");
    my @board_list;

    $sth->execute;
    while(my ($board_id,$board) = $sth->fetchrow) {
        push(@board_list, { board_id => $board_id, board => $board });
    }

    return \@board_list;
}

sub get_board_list_by_file_id {
    my $self = shift;
    my $file_id = shift || croak("need file_id");

    my $sth = $self->{dbh}->prepare("SELECT `board`,`board_id`,`thread_id`,`post_id`, `file_id`
                                     FROM `post_files`
                                     JOIN `posts` USING(`posts_rowid`)
                                     JOIN `threads` USING(`threads_rowid`)
                                     JOIN `boards` USING(`board_id`)
                                     WHERE `file_id` = ?");
    $sth->execute($file_id);

    my @id_list = ();
    while(my ($board, $board_id, $thread_id, $post_id, $fid) = $sth->fetchrow) {
        push(@id_list,{
                       board => $board,
                       board_id => $board_id,
                       thread_id => $thread_id,
                       post_id => $post_id,
                       file_id => $fid
                      });
    }

    return \@id_list;
}

sub get_thread_list {
    my $self = shift;
    my $board_id = shift || croak("need board_id");
    my $order = shift || 0;
    my $limit = shift || -1;
    my $offset = shift || 0;

    my $sth;
    if($order) {
        $sth = $self->{dbh}->prepare("SELECT `thread_id` FROM `posts`
                                      JOIN `threads` USING(`threads_rowid`)
                                      WHERE `board_id` = ? GROUP BY `thread_id`
                                      ORDER BY COUNT(*) DESC LIMIT ? OFFSET ?");
    } else {
        $sth = $self->{dbh}->prepare("SELECT `thread_id` FROM `posts`
                                      JOIN `threads` USING(`threads_rowid`)
                                      WHERE `board_id` = ? GROUP BY `thread_id`
                                      ORDER BY `thread_id` DESC LIMIT ? OFFSET ?");
    }

    $sth->execute($board_id,$limit,$offset);

    my @thread_list;
    while(my ($thread_id) = $sth->fetchrow) {
        push(@thread_list, {board_id => $board_id, thread_id => $thread_id });
    }

    return \@thread_list;
}

sub get_file_list {
    my $self = shift;
    my $file_type = shift || "";
    my $board = shift || "%";
    my $limit = shift || -1;
    my $offset = shift || 0;
    my $order = shift || 0;

    if($order) {
        $order = "DESC";
    } else {
        $order = "ASC";
    }

    my $sth = $self->{dbh}->prepare("SELECT `file_id`,`path`,`md5` FROM `files`
                                    JOIN `post_files` USING (`file_id`)
                                    JOIN `posts` USING(`posts_rowid`)
                                    JOIN `threads` USING(`threads_rowid`)
                                    JOIN `boards` USING (`board_id`)
                                    WHERE `path` LIKE ? AND `board` LIKE ?
                                    GROUP BY `file_id` ORDER BY `path` $order
                                    LIMIT ? OFFSET ?");

    $sth->execute("%$file_type",$board,$limit,$offset);

    my @file_list = ();
    while(my ($file_id,$path,$md5) = $sth->fetchrow) {
        push(@file_list, { file_id => $file_id, path => $path, md5 => $md5 });
    }

    return \@file_list;
}

sub get_file_list_count {
    my $self = shift;
    my $filetype = shift || "";
    my $board = shift || "";

    my $sth = $self->{dbh}->prepare("SELECT COUNT(*)
                                     FROM (SELECT `path` FROM `files`
                                           JOIN `post_files` USING (`file_id`)
                                           JOIN `posts` USING(`posts_rowid`)
                                           JOIN `threads` USING(`threads_rowid`)
                                           JOIN `boards` USING (`board_id`)
                                           WHERE `path` LIKE ? AND `board` LIKE ?
                                           GROUP BY `file_id`)");

    $sth->execute("%$filetype",$board);
    my ($count) = $sth->fetchrow;

    return $count;
}

sub get_file_list_by_post {
    my $self = shift;
    my $posts_rowid = shift || croak("need posts_rowid");

    my $sth = $self->{dbh}->prepare("SELECT `file_id`,`path`,`md5` FROM `post_files`
                                     JOIN `files` USING(`file_id`)
                                     WHERE `posts_rowid` = ? ORDER BY `path` ASC");

    my @file_list;
    $sth->execute($posts_rowid);
    while(my ($file_id,$path,$md5) = $sth->fetchrow) {
        push(@file_list, { file_id => $file_id, path => $path, md5 => $md5});
    }

    return \@file_list;
}

sub get_file_list_by_tag {
    my $self = shift;
    my $tags_rowid = shift || croak("need tags_rowid");
    my $limit = shift || 0;
    my $offset = shift || 0;

    my $sth = $self->{dbh}->prepare("SELECT `file_id`,`path`,`md5` FROM `tags`
                                     JOIN `file_tags` USING(`tags_rowid`)
                                     JOIN `files` USING(`file_id`)
                                     WHERE `tags_rowid` = ? LIMIT ? OFFSET ?");

    $sth->execute($tags_rowid,$limit,$offset);

    my @file_list = ();

    while(my ($file_id,$path,$md5) = $sth->fetchrow) {
        push(@file_list,{file_id => $file_id, path => $path, md5 => $md5});
    }

    return \@file_list;
}

sub get_file_list_by_tag_count {
    my $self = shift;
    my $tags_rowid = shift || croak("need tags_rowid");

    my $sth = $self->{dbh}->prepare("SELECT COUNT(*) FROM `tags`
                                     JOIN `file_tags` USING(`tags_rowid`)
                                     JOIN `files` USING(`file_id`)
                                     WHERE `tags_rowid` = ?");
    
    $sth->execute($tags_rowid);
    my ($count) = $sth->fetchrow;

    return $count;
}

sub get_tag_list_by_file_id {
    my $self = shift;
    my $file_id = shift || croak("need file_id");

    my $sth = $self->{dbh}->prepare("SELECT `tags_rowid`,`tag` FROM `tags`
                                     JOIN `file_tags` USING (`tags_rowid`)
                                     JOIN `files` USING (`file_id`)
                                     WHERE `file_id` = ?");

    $sth->execute($file_id);

    my @tag_list = ();
    
    while(my ($tags_rowid,$tag) = $sth->fetchrow) {
        push(@tag_list, { tags_rowid => $tags_rowid, tag => $tag });
    }

    return \@tag_list;
}

sub get_tag_list_by_letter {
    my $self = shift;
    my $letter = shift || "";

    my $sth = $self->{dbh}->prepare("SELECT `tags_rowid`,`tag` FROM `tags` WHERE `tag` LIKE ?");

    $sth->execute("$letter%");

    my @tag_list;
    while(my ($tags_rowid,$tag) = $sth->fetchrow) {
        push(@tag_list, { tags_rowid => $tags_rowid, tag=>$tag });
    }
    return \@tag_list;
}

sub get_popular_subjects_list {
    my $self = shift;
    my $limit = shift || 10;

    my $sth = $self->{dbh}->prepare("SELECT COUNT(`subject`),`subject` FROM `posts`
                                     WHERE `subject` != \"\"
                                     GROUP BY `subject` ORDER BY COUNT(`subject`) DESC
                                     LIMIT ?");

    $sth->execute($limit);

    my @subject_list = ();
    while(my ($count,$subject) = $sth->fetchrow) {
        push(@subject_list,{ count => $count, subject => $subject });
    }

    return \@subject_list;
}

sub get_popular_files_list {
    my $self = shift;
    my $limit = shift || 10;

    my $sth = $self->{dbh}->prepare("SELECT `file_id`,`path`,`md5` FROM `post_files`
                                     JOIN `files` USING(`file_id`)
                                     GROUP BY `file_id` ORDER BY COUNT(`file_id`) DESC
                                     LIMIT ?");

    $sth->execute($limit);

    my @popular_file_list = ();
    while(my ($file_id,$path,$md5) = $sth->fetchrow) {
        push(@popular_file_list, {
                                  file_id => $file_id,
                                  path => $path,
                                  md5 => $md5
        });
    }

    return \@popular_file_list;
}

sub get_total_files {
    my $self = shift;

    my $sth = $self->{dbh}->prepare("SELECT COUNT(*) FROM `files`");

    $sth->execute();
    my ($count) = $sth->fetchrow;

    return $count;
}

sub get_total_posts {
    my $self = shift;
    my $thread_id = shift || undef;

    my $sth;
    if($thread_id) {
        $sth = $self->{dbh}->prepare("SELECT COUNT(*) FROM `posts`
                                      JOIN `threads` USING(`threads_rowid`)
                                      WHERE `thread_id` = ?");
        $sth->execute($thread_id);
    } else {
        $sth = $self->{dbh}->prepare("SELECT COUNT(*) FROM `posts`");
        $sth->execute();
    }

    my ($count) = $sth->fetchrow;

    return $count;
}

sub get_total_threads {
    my $self = shift;
    my $board_id = shift;

    my $sth;
    if($board_id) {
        $sth = $self->{dbh}->prepare("SELECT COUNT(*) FROM `threads` WHERE `board_id` = ?");
        $sth->execute($board_id);
    } else {
        $sth = $self->{dbh}->prepare("SELECT COUNT(*) FROM `threads`");
        $sth->execute;
    }

    my ($count) = $sth->fetchrow;

    return $count;
}

sub delete_tag {
    my $self = shift;
    my $tags_rowid = shift || croak("need tags_rowid");
    my $file_id = shift || croak("need file_id");

    my $sth = $self->{dbh}->prepare("DELETE FROM `file_tags`
                                     WHERE EXISTS (SELECT * FROM `tags`
                                                   WHERE `file_tags`.`tags_rowid` = `tags`.`tags_rowid`
                                                   AND `tags_rowid` = ?
                                                   AND `file_id` = ?)");

    $sth->execute($tags_rowid,$file_id);
    $self->{dbh}->commit;
}

sub setup {
    my $self = shift;
    my $dbh = $self->{dbh};

    $dbh->do("CREATE TABLE 
              IF NOT EXISTS `boards` (`board_id` INTEGER PRIMARY KEY NOT NULL,
                                      `board` VARCHAR(4) UNIQUE NOT NULL)");

    $dbh->do("CREATE TABLE
              IF NOT EXISTS `threads` (`threads_rowid` INTEGER PRIMARY KEY,
                                       `thread_id` INTEGER NOT NULL,
                                       `board_id` INTEGER NOT NULL,
                                        UNIQUE (`thread_id`,`board_id`),
                                        FOREIGN KEY(`board_id`) REFERENCES `boards`(`board_id`)
                                        ON DELETE CASCADE ON UPDATE CASCADE);");

    $dbh->do("CREATE TABLE
              IF NOT EXISTS `posts` (`posts_rowid` INTEGER PRIMARY KEY,
                                     `threads_rowid` INTEGER NOT NULL,
                                     `post_id` INTEGER NOT NULL,
                                     `subject` TEXT,
                                     `user` TEXT,
                                     `date` TEXT,
                                     `text` TEXT,
                                      UNIQUE(`threads_rowid`,`post_id`),
                                      FOREIGN KEY(`threads_rowid`) REFERENCES `threads`(`threads_rowid`)
                                      ON DELETE CASCADE ON UPDATE CASCADE)");
    
    $dbh->do("CREATE TABLE
              IF NOT EXISTS `files` (`file_id` INTEGER PRIMARY KEY NOT NULL,
                                     `path` TEXT UNIQUE NOT NULL,
                                     `md5` VARCHAR(32) UNIQUE NOT NULL)");

    $dbh->do("CREATE TABLE
              IF NOT EXISTS `post_files` (`post_files_rowid` INTEGER PRIMARY KEY,
                                          `file_id` INTEGER NOT NULL,
                                          `posts_rowid` INTEGER NOT NULL,
                                           UNIQUE(`file_id`,`posts_rowid`),
                                           FOREIGN KEY(`file_id`) REFERENCES `files`(`file_id`)
                                           ON DELETE CASCADE ON UPDATE CASCADE,
                                           FOREIGN KEY(`posts_rowid`) REFERENCES `posts`(`posts_rowid`)
                                           ON DELETE CASCADE ON UPDATE CASCADE)");

    $dbh->do("CREATE TABLE
              IF NOT EXISTS `tags` (`tags_rowid` INTEGER PRIMARY KEY,
                                    `tag` TEXT UNIQUE NOT NULL)");

    $dbh->do("CREATE TABLE
              IF NOT EXISTS `file_tags` (`file_tags_rowid` INTEGER PRIMARY KEY,
                                         `tags_rowid` INTEGER NOT NULL,
                                         `file_id` INTEGER NOT NULL,
                                          UNIQUE(`tags_rowid`,`file_id`),
                                          FOREIGN KEY(`tags_rowid`) REFERENCES `tags`(`tags_rowid`)
                                          ON DELETE CASCADE ON UPDATE CASCADE,
                                          FOREIGN KEY(`file_id`) REFERENCES `files`(`file_id`)
                                          ON DELETE CASCADE ON UPDATE CASCADE)");

    $dbh->do("CREATE TRIGGER
              IF NOT EXISTS `file_tags_delete` AFTER DELETE ON `file_tags`
              BEGIN
                  DELETE FROM `tags`
                  WHERE NOT EXISTS (SELECT * FROM `file_tags`
                                    WHERE `tags`.`tags_rowid` = `file_tags`.`tags_rowid`);
              END");

    $dbh->do("CREATE TRIGGER
              IF NOT EXISTS `post_files_delete` AFTER DELETE ON `post_files`
              BEGIN
                  DELETE FROM `files`
                  WHERE NOT EXISTS (SELECT * FROM `post_files`
                                    WHERE `files`.file_id = `post_files`.`file_id`);
              END");

    $dbh->commit;
}

sub DESTROY {
    my $self = shift;

    $self->{dbh}->disconnect;
}
1;
