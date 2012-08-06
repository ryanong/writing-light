set :application, "connecting-light"
set :deploy_to, "/var/www/connecting-light"

set :scm, :git
set :repository, "git@github.com:ryanong/connecting-light.git"

default_run_options[:pty] = true
set :user, "deploy"
set :domain, "198.101.221.127"
set :normalize_asset_timestamps, false

role :app, domain
role :web, domain
role :db,  domain, :primary => true

namespace :deploy do
  desc "Stop Forever"
  task :stop do
    run "sudo forever stopall" 
  end

  desc "Start Forever"
  task :start do
    run "cd #{current_path} && sudo forever start app.js 80" 
  end

  desc "Restart Forever"
  task :restart do
    stop
    sleep 5
    start
  end

  desc "Refresh shared node_modules symlink to current node_modules"
  task :refresh_symlink do
    run "rm -rf #{current_path}/node_modules && ln -s #{shared_path}/node_modules #{current_path}/node_modules"
  end

  desc "Install node modules non-globally"
  task :npm_install do
    run "cd #{current_path} && npm install"
  end
end

after "deploy:update_code", "deploy:refresh_symlink", "deploy:npm_install"
