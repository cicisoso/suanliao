<?php

date_default_timezone_set('Asia/Shanghai');

$mirrordir = '/home/jugit/';
$logdir = $mirrordir . 'log/';

$json = file_get_contents('php://input');

/*
$data = array(
	'ref'=> 'refs/heads/test',
	'repository' => array(
		'url'=> 'git@gitlab.alibaba-inc.com:ju/hook.git',
		'name'=> 'hook'
	)
);
*/
$data = json_decode($json, true);

if(!$data){
	echo 'welcome git hook by juhuasuan.com UED';
	// writelog($data);
}else{
	$branch = $data['ref'];
	$repo_name = $data['repository']['name'];
	if($branch && $repo_name){
	
		$repo_dir = $mirrordir . $repo_name . '/';
		$repo_git_dir = $repo_dir . '.git';
		// if repo is exists, then merge to master
		if(file_exists($repo_dir) && file_exists($repo_git_dir)){
			$cmd = "cd $repo_dir; git pull origin " . $branch .' -f';
			exec($cmd . ' 2>&1', $output, $status);
			echo $cmd;
			if($status == 0){
				writelog($data);
				exec( "echo 'merge " . $repo_name . " done" . date('Y-m-d H:i:s', time()) . "' > done.txt");
			}else{
				exec( "echo 'merge " . $repo_name . " error" . var_export($output) . "----- ". date('Y-m-d H:i:s', time()) . "' > error.txt");
			}	
		}else{	// repo not found, try clone the repo
			$url = $data['repository']['url'];
			if($url){
				$cmd = "cd $mirrordir; git clone $url;";
				exec($cmd, $output, $status);
				if($status == 0){
					$data['change'] = $output;
					writelog($data);
					exec( "echo 'create" . $repo_name . " done" . date('Y-m-d H:i:s', time()) . "' > done.txt");
				}else{
					exec( "echo 'create " . $repo_name . " error" . var_export($output) . "-------" . date('Y-m-d H:i:s', time()) . "' > error.txt");
				}
			}
		}
	}else	{
		echo 'welcome git hook by juhuasuan.com UED';
	}
}



function _g($name){
	return isset($_GET[$name]) ? $_GET[$name] : '';
}

function dbg($msg){
	echo '<pre>';
	print_r($msg);
}
function writelog($data){
	global $logdir;
	$ext = var_export($data);
	//exec( 'echo ' . $ext . ' > success.txt');
	$repo = $data['repository']['name'];

	$date = date('Y-m-d', time());
	
	$log_repo_dir = $logdir . $repo . '/' . $date;
	$log_repo_file = $log_repo_dir . '/log.txt';
	
	// create dir
	if(!file_exists($log_repo_dir) && !is_dir($log_repo_dir)){
		mkdir($log_repo_dir, 0777, true);
	}

	$str = '<?php ';
	$str .= '$createTime = "' . date('Y-m-d H:i:s', time()) . '"; ';
	$str .= '$msg = ' . var_export($data, true) . ';';
	$fp = fopen($log_repo_file, 'w');
	if(!$fp) return false;
	if(flock($fp, LOCK_EX)){
		fwrite($fp, $str);
	}
	flock($fp, LOCK_EX);
	fclose($fp);
	
}