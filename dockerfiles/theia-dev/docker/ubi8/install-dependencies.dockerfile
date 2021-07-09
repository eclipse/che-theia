USER root
RUN yum install -y curl make cmake gcc gcc-c++ python2 git git-core-doc openssh less bash tar gzip rsync patch libsecret libsecret-devel \
    && yum -y clean all && rm -rf /var/cache/yum
